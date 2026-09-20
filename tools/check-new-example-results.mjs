import { isDeepStrictEqual } from "node:util";

// Explicit expectations live outside the compiler and the bytecode interpreter.
export function checkResults(plan, results) {
  if (!plan.length) throw Error("No new examples selected");
  const expectedProjects = plan.map((item) => item.project).sort();
  const actualProjects = results.map((item) => item.project).sort();
  if (
    new Set(expectedProjects).size !== plan.length ||
    !isDeepStrictEqual(expectedProjects, actualProjects)
  )
    throw Error("Results must contain every selected project exactly once");
  return plan.map((lesson) => {
    const result = results.find((item) => item.project === lesson.project);
    const checks = [];
    const compare = (scenario, check, actual, expected) =>
      checks.push({ scenario, check, expected, actual, pass: isDeepStrictEqual(actual, expected) });
    const inspect = (name, run, expectations) => {
      if (!expectations?.length) throw Error(`${lesson.project}: no expectations for ${name}`);
      compare(name, "execution status", run.status, "ended");
      for (const expectation of expectations) {
        if (expectation.result) {
          const actual = expectation.result.split(".").reduce((value, key) => value?.[key], run);
          if (expectation.minimum !== undefined)
            compare(
              name,
              expectation.result + " >= " + expectation.minimum,
              typeof actual === "number" && actual >= expectation.minimum,
              true,
            );
          else compare(name, expectation.result, actual, expectation.expected);
        } else {
          const operations = expectation.ops ?? [expectation.op];
          const actual = run.trace
            .filter((entry) => operations.includes(entry.op))
            .map((entry) =>
              expectation.field.split(".").reduce((value, key) => value?.[key], entry),
            );
          compare(
            name,
            operations.join(", ") + ": " + expectation.field,
            actual,
            expectation.expected,
          );
        }
      }
    };
    inspect("default", result, lesson.checks);
    const scenarios = lesson.scenarios ?? [];
    if (result.variants.length !== scenarios.length)
      throw Error(`${lesson.project}: missing or unexpected scenarios`);
    scenarios.forEach((scenario, index) => {
      const variant = result.variants[index];
      const name = JSON.stringify(scenario.input);
      compare(name, "scenario input", variant.scenario, scenario.input);
      inspect(name, variant, scenario.checks);
    });
    return {
      project: lesson.project,
      bytes: result.bytes,
      sha256: result.sha256,
      sources: result.sources,
      instructions: result.instructions,
      runs: 1 + scenarios.length,
      checks,
      pass: checks.every((check) => check.pass),
    };
  });
}
