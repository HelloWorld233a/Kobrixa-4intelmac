import type { IRFunction, IRInstruction, KobrixaIR } from "@kobrixa/ir";

/** EV3 SUBCALL objects have one local frame and cannot call themselves while busy. */
export const RECURSION_DEPTH = 32;

export function expandRecursiveCalls(ir: KobrixaIR): KobrixaIR {
  const canonical = (name: string): string => name.toLocaleLowerCase("en-US");
  const edges = new Map(
    ir.functions.map((fn) => [
      canonical(fn.name),
      fn.blocks.flatMap((block) =>
        block.instructions.flatMap((instruction) =>
          instruction.op === "call" ? [canonical(instruction.functionName)] : [],
        ),
      ),
    ]),
  );
  const reachable = (start: string): Set<string> => {
    const seen = new Set<string>();
    const pending = [...(edges.get(start) ?? [])];
    while (pending.length) {
      const next = pending.pop()!;
      if (seen.has(next)) continue;
      seen.add(next);
      pending.push(...(edges.get(next) ?? []));
    }
    return seen;
  };
  const reach = new Map([...edges.keys()].map((name) => [name, reachable(name)]));
  const recursive = ir.functions.filter((fn) =>
    reach.get(canonical(fn.name))!.has(canonical(fn.name)),
  );
  if (!recursive.length) return ir;
  const nameAt = (name: string, depth: number): string =>
    depth === 0 ? canonical(name) : `$recursive:${canonical(name)}:${depth}`;
  const clone = (fn: IRFunction, depth: number): IRFunction => ({
    ...fn,
    name: nameAt(fn.name, depth),
    blocks: fn.blocks.map((block) => ({
      ...block,
      instructions: block.instructions.map((instruction): IRInstruction => {
        if (instruction.op !== "call") return instruction;
        const caller = canonical(fn.name),
          callee = canonical(instruction.functionName);
        if (!reach.get(caller)?.has(callee) || !reach.get(callee)?.has(caller)) return instruction;
        if (depth + 1 === RECURSION_DEPTH)
          return {
            op: "ev3-call",
            operation: "Assert.Failed",
            args: [{ kind: "string", value: `Recursion exceeds ${RECURSION_DEPTH} frames` }],
            ...(instruction.span ? { span: instruction.span } : {}),
          };
        return { ...instruction, functionName: nameAt(callee, depth + 1) };
      }),
    })),
  });
  return {
    ...ir,
    functions: [
      ...ir.functions.map((fn) => (recursive.includes(fn) ? clone(fn, 0) : fn)),
      ...Array.from({ length: RECURSION_DEPTH - 1 }, (_, index) =>
        recursive.map((fn) => clone(fn, index + 1)),
      ).flat(),
    ],
  };
}
