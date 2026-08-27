import { useEffect, useRef } from "react";
import * as monaco from "monaco-editor";
import { BASIC_PLUS_COMPLETIONS, BASIC_PLUS_KEYWORDS, formatBasicPlus } from "@kobrixa/basic-plus";
import type { Diagnostic } from "../shared/api.js";

let registered = false;
function registerLanguage(): void {
  if (registered) return;
  registered = true;
  monaco.languages.register({ id: "basic-plus", extensions: [".bp", ".bpi", ".bpm"] });
  monaco.languages.setMonarchTokensProvider("basic-plus", {
    ignoreCase: true,
    keywords: [...BASIC_PLUS_KEYWORDS],
    tokenizer: {
      root: [
        [/[A-Za-z_][\w.]*/, { cases: { "@keywords": "keyword", "@default": "identifier" } }],
        [/\d+(?:\.\d+)?/, "number"],
        [/"(?:[^"]|"")*"/, "string"],
        [/'[^\n]*/, "comment"],
        [/[=<>+\-*/%]+/, "operator"],
      ],
    },
  });
  monaco.languages.registerCompletionItemProvider("basic-plus", {
    provideCompletionItems: () => ({
      suggestions: BASIC_PLUS_COMPLETIONS.map((label) => ({
        label,
        kind: label.includes(".")
          ? monaco.languages.CompletionItemKind.Method
          : monaco.languages.CompletionItemKind.Keyword,
        insertText: label,
        range: undefined as never,
      })),
    }),
  });
  monaco.languages.registerDocumentFormattingEditProvider("basic-plus", {
    provideDocumentFormattingEdits: (model) => [
      { range: model.getFullModelRange(), text: formatBasicPlus(model.getValue()) },
    ],
  });
}

interface EditorProps {
  file: string;
  value: string;
  diagnostics: Diagnostic[];
  focusLine: number | undefined;
  onChange(value: string): void;
}

export function Editor({
  file,
  value,
  diagnostics,
  focusLine,
  onChange,
}: EditorProps): React.JSX.Element {
  const container = useRef<HTMLDivElement>(null);
  const editor = useRef<monaco.editor.IStandaloneCodeEditor | undefined>(undefined);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    registerLanguage();
    if (!container.current) return undefined;
    const model = monaco.editor.createModel(
      value,
      file.endsWith(".json") ? "json" : "basic-plus",
      monaco.Uri.file(`/${file}`),
    );
    const instance = monaco.editor.create(container.current, {
      model,
      theme: "vs-dark",
      automaticLayout: true,
      minimap: { enabled: false },
      fontFamily: "JetBrains Mono, SFMono-Regular, Consolas, monospace",
      fontSize: 14,
      lineHeight: 22,
      padding: { top: 16 },
      bracketPairColorization: { enabled: true },
      smoothScrolling: true,
      renderWhitespace: "selection",
    });
    editor.current = instance;
    const subscription = instance.onDidChangeModelContent(() =>
      onChangeRef.current(instance.getValue()),
    );
    return () => {
      subscription.dispose();
      instance.dispose();
      model.dispose();
    };
  }, [file]);

  useEffect(() => {
    const model = editor.current?.getModel();
    if (!model || model.getValue() === value) return;
    model.setValue(value);
  }, [value]);

  useEffect(() => {
    const model = editor.current?.getModel();
    if (!model) return;
    monaco.editor.setModelMarkers(
      model,
      "kobrixa",
      diagnostics
        .filter((item) => item.file === file)
        .map((item) => ({
          severity:
            item.severity === "error"
              ? monaco.MarkerSeverity.Error
              : item.severity === "warning"
                ? monaco.MarkerSeverity.Warning
                : monaco.MarkerSeverity.Info,
          message: `${item.code}: ${item.message}`,
          startLineNumber: item.range.startLine,
          startColumn: item.range.startColumn,
          endLineNumber: item.range.endLine,
          endColumn: item.range.endColumn,
        })),
    );
  }, [diagnostics, file]);

  useEffect(() => {
    if (!focusLine || !editor.current) return;
    editor.current.revealLineInCenter(focusLine);
    editor.current.setPosition({ lineNumber: focusLine, column: 1 });
    editor.current.focus();
  }, [focusLine]);

  return <div className="editor" ref={container} />;
}
