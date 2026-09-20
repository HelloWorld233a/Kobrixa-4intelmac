import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadProject } from "../packages/compiler/dist/index.js";
import { BasicPlusFrontend } from "../frontends/basic-plus/dist/index.js";
const root = fileURLToPath(new URL("../", import.meta.url));
const read = async (name) =>
  JSON.parse(await fs.readFile(path.join(root, "examples", name), "utf8"));
const reference = await read("clev3r-reference.json");
const parity = await read("clev3r-parity.json");
const supplemental = await read("new-examples.json");
const programs = reference.files.filter((file) => file.path.endsWith(".bp"));
assert.equal(programs.length, 41);
assert.deepEqual(
  parity.map((lesson) => lesson.reference).sort(),
  programs.map((file) => file.path).sort(),
);
assert.equal(new Set([...parity, ...supplemental].map((lesson) => lesson.project)).size, 61);
for (const lesson of parity) {
  assert.equal(lesson.referenceBlob, programs.find((file) => file.path === lesson.reference).blob);
  assert(lesson.requirements.length && lesson.checks.length, lesson.project);
}
for (const file of reference.files.filter((file) => !file.path.endsWith(".bp"))) {
  const replacement = reference.helpers[file.path];
  assert(replacement, "Unmapped helper/asset: " + file.path);
  await fs.access(path.join(root, "examples", replacement));
}
const covered = new Map();
for (const lesson of [...parity, ...supplemental]) {
  const project = await loadProject(path.join(root, "examples", lesson.project));
  assert.deepEqual(project.diagnostics, []);
  const front = await new BasicPlusFrontend().compile(
    project.project,
    new AbortController().signal,
  );
  assert.deepEqual(front.diagnostics, []);
  for (const instruction of front.ir.functions.flatMap((fn) =>
    fn.blocks.flatMap((block) => block.instructions),
  )) {
    const op =
      instruction.op === "ev3-call"
        ? instruction.operation
        : instruction.op === "thread-start"
          ? "Thread.Run"
          : undefined;
    if (op) {
      const owners = covered.get(op) ?? new Set();
      owners.add(lesson.project);
      covered.set(op, owners);
    }
  }
}
assert.deepEqual(
  reference.apiNames.filter((name) => !covered.has(name)),
  [],
  "Reference APIs missing from the newly added projects",
);
console.log(
  `${parity.length}/${programs.length} main programs, ${Object.keys(reference.helpers).length}/8 helper/assets, ${reference.apiNames.length}/${reference.apiNames.length} reference APIs covered by 61 new examples.`,
);
if (process.argv.includes("--write-report")) {
  const lines = [
    "# Clev3r API coverage / Clev3r API 覆蓋",
    "",
    "All names below occur in the pinned reference examples and helpers, and in the IR compiled from the 61 newly added Kobrixa projects. This is API presence coverage; executable behavior is checked separately by the bytecode audit.／以下名稱來自固定版本參考範例及輔助檔，亦出現在 61 個新 Kobrixa 範例的編譯 IR 中。這是 API 使用覆蓋，實際行為另外由字節碼稽核檢查。",
    "",
    "[Curriculum and audit / 課程與稽核](CLEV3R-PARITY.md)",
    "",
    "| API | New examples / 新範例 |",
    "| --- | --- |",
  ];
  for (const name of reference.apiNames)
    lines.push(
      `| ${name} | ${[...covered.get(name)].map((project) => `[${project}](${project}/)`).join(", ")} |`,
    );
  await fs.writeFile(path.join(root, "examples/CLEV3R-API-COVERAGE.md"), lines.join("\n") + "\n");
}
