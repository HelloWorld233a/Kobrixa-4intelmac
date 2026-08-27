import { readFile, writeFile } from "node:fs/promises";
import process from "node:process";
import { UsbTransport, WiFiTransport } from "@kobrixa/device";

const options = Object.fromEntries(
  process.argv.slice(2).map((argument) => {
    const [key, ...value] = argument.replace(/^--/, "").split("=");
    return [key, value.join("=")];
  }),
);

if (!options.transport || !options.artifact) {
  console.error(
    "Usage: pnpm test:hardware -- --transport=usb|wifi --artifact=/path/program.rbf [--address=IP] [--output=result.json]",
  );
  process.exitCode = 2;
} else {
  const controller = new AbortController();
  const transport = options.transport === "wifi" ? new WiFiTransport() : new UsbTransport();
  const result = {
    schemaVersion: 1,
    candidate: true,
    platform: process.platform,
    architecture: process.arch,
    transport: options.transport,
    startedAt: new Date().toISOString(),
    cases: [],
  };
  try {
    let descriptor;
    if (options.address)
      descriptor = {
        id: `wifi:${options.address}`,
        name: `EV3 ${options.address}`,
        transport: "wifi",
        address: options.address,
      };
    else descriptor = (await transport.discover(controller.signal))[0];
    if (!descriptor) throw new Error("No EV3 was found.");
    const session = await transport.connect(descriptor, controller.signal);
    const data = await readFile(options.artifact);
    const remotePath = "/home/root/lms2012/prjs/kobrixa_acceptance.rbf";
    for (const [name, operation] of [
      ["upload", () => session.upload(remotePath, data, controller.signal)],
      ["run", () => session.run(remotePath, controller.signal)],
      ["stop", () => session.stop("kobrixa_acceptance", controller.signal)],
      ["delete", () => session.delete(remotePath, controller.signal)],
      ["disconnect", () => session.disconnect()],
    ]) {
      const began = Date.now();
      await operation();
      result.cases.push({ name, passed: true, durationMs: Date.now() - began });
    }
    result.passed = true;
  } catch (error) {
    result.passed = false;
    result.error = error instanceof Error ? error.message : String(error);
    process.exitCode = 1;
  }
  result.finishedAt = new Date().toISOString();
  const json = `${JSON.stringify(result, null, 2)}\n`;
  if (options.output) await writeFile(options.output, json, "utf8");
  else process.stdout.write(json);
}
