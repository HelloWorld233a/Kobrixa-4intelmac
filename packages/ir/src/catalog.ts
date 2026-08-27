import type { IRPrimitiveType } from "./types.js";

export interface EV3OperationSignature {
  name: string;
  category: "motor" | "sensor" | "display" | "speaker" | "button" | "file" | "mailbox" | "program";
  parameters: readonly IRPrimitiveType[];
  returns: IRPrimitiveType;
}

const operations: EV3OperationSignature[] = [
  { name: "Motor.Start", category: "motor", parameters: ["string", "number"], returns: "void" },
  { name: "Motor.Stop", category: "motor", parameters: ["string", "boolean"], returns: "void" },
  {
    name: "Motor.Move",
    category: "motor",
    parameters: ["string", "number", "number", "boolean"],
    returns: "void",
  },
  { name: "Motor.GetCount", category: "motor", parameters: ["string"], returns: "number" },
  {
    name: "Sensor.Read",
    category: "sensor",
    parameters: ["integer", "integer"],
    returns: "number",
  },
  { name: "Sensor.Wait", category: "sensor", parameters: ["integer", "number"], returns: "void" },
  { name: "LCD.Clear", category: "display", parameters: [], returns: "void" },
  {
    name: "LCD.Text",
    category: "display",
    parameters: ["integer", "integer", "string"],
    returns: "void",
  },
  {
    name: "LCD.Line",
    category: "display",
    parameters: ["integer", "integer", "integer", "integer"],
    returns: "void",
  },
  {
    name: "LCD.Circle",
    category: "display",
    parameters: ["integer", "integer", "integer"],
    returns: "void",
  },
  { name: "LCD.Update", category: "display", parameters: [], returns: "void" },
  {
    name: "Speaker.Tone",
    category: "speaker",
    parameters: ["number", "number", "number"],
    returns: "void",
  },
  { name: "Speaker.Play", category: "speaker", parameters: ["number", "string"], returns: "void" },
  { name: "Speaker.Stop", category: "speaker", parameters: [], returns: "void" },
  { name: "Button.IsPressed", category: "button", parameters: ["string"], returns: "boolean" },
  { name: "EV3File.OpenRead", category: "file", parameters: ["string"], returns: "integer" },
  { name: "EV3File.OpenWrite", category: "file", parameters: ["string"], returns: "integer" },
  { name: "EV3File.Close", category: "file", parameters: ["integer"], returns: "void" },
  { name: "EV3File.ReadLine", category: "file", parameters: ["integer"], returns: "string" },
  {
    name: "EV3File.WriteLine",
    category: "file",
    parameters: ["integer", "string"],
    returns: "void",
  },
  { name: "Mailbox.Send", category: "mailbox", parameters: ["string", "string"], returns: "void" },
  { name: "Mailbox.Receive", category: "mailbox", parameters: ["string"], returns: "string" },
  { name: "Program.Delay", category: "program", parameters: ["number"], returns: "void" },
  { name: "Program.Stop", category: "program", parameters: [], returns: "void" },
];

export const EV3_OPERATION_CATALOG = new Map(
  operations.map((operation) => [operation.name.toLocaleLowerCase("en-US"), operation] as const),
);

export function getEV3Operation(name: string): EV3OperationSignature | undefined {
  return EV3_OPERATION_CATALOG.get(name.toLocaleLowerCase("en-US"));
}
