// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { WorkspaceSummary } from "../../shared/api.js";
import { EntryPickerDialog, rankEntryCandidates } from "./entry-picker-dialog.js";

let root: Root;
let container: HTMLDivElement;

beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

it("ranks main.bp, src/main.bp, and folder-matching files ahead of subfolder helpers", () => {
  const ranked = rankEntryCandidates(
    ["lib/helper.bp", "src/main.bp", "main.bp", "alpha.bp"],
    "robot-arm",
    "zh-TW",
  );
  expect(ranked.map((r) => r.path)).toEqual([
    "main.bp",
    "src/main.bp",
    "alpha.bp",
    "lib/helper.bp",
  ]);
  expect(ranked[0]?.isRecommended).toBe(true);
  expect(ranked[0]?.reasonLabel).toContain("預設主程式");
});

it("renders the entry picker list with recommended badges and live code preview", async () => {
  const workspace: WorkspaceSummary = {
    id: "ws-1",
    name: "line-follower",
    rootLabel: "line-follower",
    locationLabel: "/tmp/line-follower",
    files: ["utils/math.bp", "main.bp"],
    entries: [
      { path: "utils", kind: "directory" },
      { path: "utils/math.bp", kind: "file" },
      { path: "main.bp", kind: "file" },
    ],
    implicit: true,
    entryCandidates: ["utils/math.bp", "main.bp"],
    drafts: {},
  };

  const onSelectEntry = vi.fn();
  const onConfirm = vi.fn();
  const onClose = vi.fn();
  const readFile = vi.fn(async (_id: string, file: string) => ({
    content:
      file === "main.bp"
        ? 'import "utils/math"\nSub Main()\n  Motor.Start("AB", 50)\nEndSub\n'
        : "Function Clamp(v)\n  Return v\nEndFunction\n",
  }));

  await act(async () => {
    root.render(
      createElement(EntryPickerDialog, {
        workspace,
        locale: "zh-TW",
        selectedEntry: "main.bp",
        onSelectEntry,
        onConfirm,
        onClose,
        readFile,
      }),
    );
  });

  expect(document.body.textContent).toContain("選擇進入點檔案");
  expect(document.body.textContent).toContain("推薦主程式");
  expect(document.body.textContent).toContain("包含 Sub Main");
  expect(document.body.textContent).toContain("EV3 硬體呼叫");
  expect(document.body.textContent).toContain('Motor.Start("AB", 50)');

  const options = [...document.body.querySelectorAll("[role=option]")];
  expect(options).toHaveLength(2);
  expect(options[0]?.textContent).toContain("main.bp");
});
