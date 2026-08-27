import { EV3_OPERATION_CATALOG } from "@kobrixa/ir";

export const BASIC_PLUS_KEYWORDS = [
  "And",
  "Else",
  "ElseIf",
  "EndFor",
  "EndFunction",
  "EndIf",
  "EndModule",
  "EndSub",
  "EndWhile",
  "False",
  "For",
  "Function",
  "Goto",
  "If",
  "Include",
  "Module",
  "Not",
  "Or",
  "Property",
  "Return",
  "Step",
  "Sub",
  "Then",
  "To",
  "True",
  "While",
] as const;

export const BASIC_PLUS_COMPLETIONS = [
  ...BASIC_PLUS_KEYWORDS,
  ...[...EV3_OPERATION_CATALOG.values()].map((operation) => operation.name),
].sort((left, right) => left.localeCompare(right));

export function formatBasicPlus(source: string): string {
  const lines = source.replaceAll("\r\n", "\n").split("\n");
  let indent = 0;
  return `${lines
    .map((raw) => {
      const line = raw.trim();
      const lower = line.toLocaleLowerCase("en-US");
      if (
        /^(else|elseif\b|endif\b|endwhile\b|endfor\b|endsub\b|endfunction\b|endmodule\b)/.test(
          lower,
        )
      ) {
        indent = Math.max(0, indent - 1);
      }
      const formatted = line ? `${"  ".repeat(indent)}${line}` : "";
      if (
        /^(if\b.*\bthen\s*$|else\s*$|elseif\b.*\bthen\s*$|while\b|for\b|sub\b|function\b|module\b)/.test(
          lower,
        )
      ) {
        indent += 1;
      }
      return formatted;
    })
    .join("\n")
    .trimEnd()}\n`;
}
