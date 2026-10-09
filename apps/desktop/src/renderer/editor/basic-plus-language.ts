import type { editor, languages } from "monaco-editor";
import { BASIC_PLUS_KEYWORDS } from "@kobrixa/basic-plus/language";

export const basicPlusMonarch: languages.IMonarchLanguage = {
  ignoreCase: true,
  tokenPostfix: ".basic-plus",
  defaultToken: "invalid",
  keywords: [...BASIC_PLUS_KEYWORDS],
  control: [
    "If",
    "Then",
    "Else",
    "ElseIf",
    "EndIf",
    "For",
    "To",
    "Step",
    "EndFor",
    "While",
    "EndWhile",
    "Break",
    "Continue",
    "Return",
    "Goto",
  ],
  types: ["Number", "String"],
  booleans: ["True", "False"],
  wordOperators: ["And", "Or", "Not"],
  tokenizer: {
    root: [
      [/[ \t\r]+/, "white"],
      [/'[^\r\n]*/, "comment"],
      // A closed literal must not consume a prefix of an unterminated escaped quote.
      [/"(?:[^"\r\n]|"")*"(?!")/, "string"],
      [/"[^\r\n]*$/, "string.invalid"],
      [
        /[A-Za-z_][\w.]*/,
        {
          cases: {
            "@types": "type",
            "@booleans": "constant.language",
            "@wordOperators": "operator.word",
            "@control": "keyword.control",
            "@keywords": "keyword",
            "@default": "identifier",
          },
        },
      ],
      [/(?:\d+\.\d*|\.\d+|\d+)/, "number"],
      [/!=|<=|>=|<>|\+=|-=|\*=|\/=|\+\+|--|[=<>+\-*/%]/, "operator"],
      [/@/, "operator"],
      [/[()[\],.:]/, "delimiter"],
    ],
  },
};

export interface SyntaxTokenColors {
  keyword?: string;
  controlKeyword?: string;
  string?: string;
  number?: string;
  comment?: string;
  identifier?: string;
  function?: string;
  variable?: string;
  type?: string;
  operator?: string;
  delimiter?: string;
}

export function basicPlusThemeRules(
  dark: boolean,
  syntax?: SyntaxTokenColors,
): editor.ITokenThemeRule[] {
  const color = (darkColor: string, lightColor: string) => (dark ? darkColor : lightColor);
  const clean = (val: string | undefined, fallback: string) => {
    if (!val) return fallback;
    return val.replace("#", "").trim();
  };

  const kw = clean(syntax?.keyword, color("569CD6", "0000FF"));
  const ctrl = clean(syntax?.controlKeyword, color("C586C0", "AF00DB"));
  const str = clean(syntax?.string, color("CE9178", "A31515"));
  const num = clean(syntax?.number, color("B5CEA8", "098658"));
  const comm = clean(syntax?.comment, color("6A9955", "008000"));
  const ident = clean(syntax?.variable || syntax?.identifier, color("9CDCFE", "001080"));
  const op = clean(syntax?.operator, color("569CD6", "0000FF"));
  const opSym = clean(syntax?.operator, color("E6EAF0", "1E2933"));
  const delim = clean(syntax?.delimiter, color("E6EAF0", "1E2933"));
  const fn = clean(syntax?.function, color("DCDCAA", "795E26"));
  const ty = clean(syntax?.type, color("4EC9B0", "267F99"));

  const rules: editor.ITokenThemeRule[] = [
    { token: "keyword.basic-plus", foreground: kw },
    { token: "keyword.control.basic-plus", foreground: ctrl },
    { token: "constant.language.basic-plus", foreground: kw },
    { token: "operator.word.basic-plus", foreground: op },
    { token: "operator.basic-plus", foreground: opSym },
    { token: "delimiter.basic-plus", foreground: delim },
    { token: "string.basic-plus", foreground: str },
    { token: "string.invalid.basic-plus", foreground: str },
    { token: "number.basic-plus", foreground: num },
    { token: "comment.basic-plus", foreground: comm },
    { token: "identifier.basic-plus", foreground: ident },
    { token: "invalid.basic-plus", foreground: color("F44747", "CD3131") },
    { token: "type", foreground: ty },
    { token: "namespace", foreground: ty },
    { token: "type.basic-plus", foreground: ty },
    { token: "namespace.basic-plus", foreground: ty },
    { token: "function", foreground: fn },
    { token: "method", foreground: fn },
    { token: "function.basic-plus", foreground: fn },
    { token: "method.basic-plus", foreground: fn },
    { token: "variable", foreground: ident },
    { token: "parameter", foreground: ident },
    { token: "variable.basic-plus", foreground: ident },
    { token: "parameter.basic-plus", foreground: ident },
    { token: "label", foreground: color("C8C8C8", "000000") },
    { token: "label.basic-plus", foreground: color("C8C8C8", "000000") },
  ];
  return rules.map((rule) => ({ ...rule, fontStyle: "" }));
}
