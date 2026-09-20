import assert from "node:assert/strict";
import { test } from "node:test";
import { checkResults } from "./check-new-example-results.mjs";

const plan = [
  {
    project: "lesson/demo",
    checks: [{ op: "UI_DRAW.TEXT", field: "args.3", expected: ["Answer: 3.5"] }],
  },
];
const result = {
  project: "lesson/demo",
  status: "ended",
  trace: [{ op: "UI_DRAW.TEXT", args: [1, 4, 12, "Answer: 3.5"] }],
  variants: [],
};
test("requires the complete selected set and rejects missing expectations", () => {
  assert.throws(() => checkResults(plan, []));
  assert.throws(() => checkResults(plan, [result, result]));
  assert.throws(() => checkResults([], []));
  assert.throws(() => checkResults([{ ...plan[0], checks: [] }], [result]));
});
test("fails when bytes run incorrectly, terminate early, or never finish", () => {
  assert.equal(checkResults(plan, [result])[0].pass, true);
  for (const invalid of [
    { ...result, trace: [] },
    { ...result, trace: [{ op: "UI_DRAW.TEXT", args: [1, 4, 12, "Answer: 4.2039e-45"] }] },
    { ...result, status: "error", error: "unsupported opcode" },
    { ...result, status: "bounded" },
  ])
    assert.equal(checkResults(plan, [invalid])[0].pass, false);
});
test("requires every declared scenario and its exact input", () => {
  const withScenario = [
    { ...plan[0], scenarios: [{ input: { sensor: 30 }, checks: plan[0].checks }] },
  ];
  assert.throws(() => checkResults(withScenario, [result]));
  const complete = { ...result, variants: [{ ...result, scenario: { sensor: 30 } }] };
  assert.equal(checkResults(withScenario, [complete])[0].pass, true);
  complete.variants[0].scenario.sensor = 29;
  assert.equal(checkResults(withScenario, [complete])[0].pass, false);
});

test("requires actual scheduler evidence for concurrent examples", () => {
  const schedulePlan = [
    { project: result.project, checks: [{ result: "scheduler.contextSwitches", minimum: 1 }] },
  ];
  assert.equal(
    checkResults(schedulePlan, [{ ...result, scheduler: { contextSwitches: 2 } }])[0].pass,
    true,
  );
  assert.equal(
    checkResults(schedulePlan, [{ ...result, scheduler: { contextSwitches: 0 } }])[0].pass,
    false,
  );
  assert.equal(checkResults(schedulePlan, [result])[0].pass, false);
});
