import { useEffect, useMemo, useState } from "react";
import type { WorkspaceSummary } from "../../shared/api.js";
import type { Locale } from "../i18n/copy.js";
import { Dialog, DialogActions } from "../components/dialog.js";

const PRIMARY_ENTRY_NAMES = new Set([
  "main.bp",
  "index.bp",
  "program.bp",
  "app.bp",
  "start.bp",
  "run.bp",
]);

export interface RankedEntryCandidate {
  path: string;
  fileName: string;
  directory: string;
  isRecommended: boolean;
  isRoot: boolean;
  reasonLabel: string;
}

export function rankEntryCandidates(
  candidates: readonly string[],
  rootLabel: string,
  locale: Locale,
): RankedEntryCandidate[] {
  const normalizedRoot = rootLabel.trim().toLowerCase();
  const isZh = locale === "zh-TW";

  const scored = candidates.map((rawPath) => {
    const normalized = rawPath.replaceAll("\\", "/");
    const slashIndex = normalized.lastIndexOf("/");
    const fileName = slashIndex >= 0 ? normalized.slice(slashIndex + 1) : normalized;
    const directory = slashIndex >= 0 ? normalized.slice(0, slashIndex) : "";
    const lowerFile = fileName.toLowerCase();
    const lowerBase = lowerFile.replace(/\.bp$/i, "");
    const depth = directory ? directory.split("/").length : 0;

    let priority = 100;
    let reasonLabel = directory
      ? isZh
        ? `子目錄 · ${directory}`
        : `Subfolder · ${directory}`
      : isZh
        ? "根目錄檔案"
        : "Root file";

    if (normalized.toLowerCase() === "main.bp") {
      priority = 0;
      reasonLabel = isZh ? "推薦 · 預設主程式" : "Recommended · Default main";
    } else if (normalized.toLowerCase() === "src/main.bp") {
      priority = 1;
      reasonLabel = isZh ? "推薦 · src 主程式" : "Recommended · src main";
    } else if (normalizedRoot && lowerBase === normalizedRoot) {
      priority = 2;
      reasonLabel = isZh ? "推薦 · 與資料夾同名" : "Recommended · Matches folder";
    } else if (PRIMARY_ENTRY_NAMES.has(lowerFile)) {
      priority = 3 + depth;
      reasonLabel = isZh ? "推薦 · 常見主程式命名" : "Recommended · Standard entry name";
    } else if (depth === 0) {
      priority = 10;
    } else {
      priority = 20 + depth;
    }

    return {
      path: rawPath,
      fileName,
      directory,
      isRecommended: priority < 10,
      isRoot: depth === 0,
      reasonLabel,
      priority,
    };
  });

  scored.sort(
    (a, b) =>
      a.priority - b.priority || a.path.localeCompare(b.path, "en", { sensitivity: "base" }),
  );

  // If none matched a special name, mark the first root-level (or very first) candidate as recommended
  if (scored.length > 0 && !scored.some((item) => item.isRecommended)) {
    scored[0]!.isRecommended = true;
    scored[0]!.reasonLabel = isZh ? "推薦 · 首選進入點" : "Recommended · Primary candidate";
  }

  return scored.map(({ priority: _priority, ...rest }) => rest);
}

interface PreviewSummary {
  lines: string[];
  totalLines: number;
  tags: string[];
}

function summarizeSource(content: string, locale: Locale): PreviewSummary {
  const isZh = locale === "zh-TW";
  const allLines = content.replace(/\r\n/g, "\n").split("\n");
  const totalLines = content.trim().length === 0 ? 0 : allLines.length;
  const previewLines = allLines.slice(0, 14);
  const tags: string[] = [];

  if (/\bSub\s+Main\b/i.test(content)) {
    tags.push(isZh ? "包含 Sub Main" : "Has Sub Main");
  }
  const includeMatches = content.match(/^\s*(?:import|#include)\b/gim);
  if (includeMatches && includeMatches.length > 0) {
    tags.push(isZh ? `引用 ${includeMatches.length} 個模組` : `${includeMatches.length} imports`);
  }
  const subMatches = content.match(/^\s*(?:Sub|Function)\s+[A-Za-z0-9_]+/gim);
  if (subMatches && subMatches.length > 0) {
    tags.push(isZh ? `${subMatches.length} 個副程式/函式` : `${subMatches.length} routines`);
  }
  if (/\b(?:Motor|LCD|Sensor|Speaker|Button|Thread)\./i.test(content)) {
    tags.push(isZh ? "EV3 硬體呼叫" : "EV3 API calls");
  }

  return {
    lines: previewLines,
    totalLines,
    tags,
  };
}

export function EntryPickerDialog({
  workspace,
  locale,
  selectedEntry,
  onSelectEntry,
  onConfirm,
  onClose,
  readFile,
}: {
  workspace: WorkspaceSummary;
  locale: Locale;
  selectedEntry: string;
  onSelectEntry: (entry: string) => void;
  onConfirm: (entry?: string) => void;
  onClose: () => void;
  readFile?: (workspaceId: string, file: string) => Promise<{ content: string | null }>;
}): React.JSX.Element {
  const isZh = locale === "zh-TW";
  const [query, setQuery] = useState("");
  const [previewState, setPreviewState] = useState<{
    file: string;
    loading: boolean;
    summary?: PreviewSummary;
  }>({ file: "", loading: false });

  const ranked = useMemo(
    () => rankEntryCandidates(workspace.entryCandidates, workspace.rootLabel, locale),
    [workspace.entryCandidates, workspace.rootLabel, locale],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ranked;
    return ranked.filter(
      (item) => item.path.toLowerCase().includes(q) || item.reasonLabel.toLowerCase().includes(q),
    );
  }, [ranked, query]);

  // Ensure selectedEntry defaults to the top ranked candidate if not already valid
  useEffect(() => {
    if (ranked.length > 0 && !workspace.entryCandidates.includes(selectedEntry)) {
      onSelectEntry(ranked[0]!.path);
    }
  }, [ranked, selectedEntry, workspace.entryCandidates, onSelectEntry]);

  useEffect(() => {
    if (!selectedEntry || !readFile) return;
    let cancelled = false;
    setPreviewState({ file: selectedEntry, loading: true });
    void readFile(workspace.id, selectedEntry)
      .then((snapshot) => {
        if (cancelled) return;
        const content = snapshot?.content ?? "";
        setPreviewState({
          file: selectedEntry,
          loading: false,
          summary: summarizeSource(content, locale),
        });
      })
      .catch(() => {
        if (cancelled) return;
        setPreviewState({ file: selectedEntry, loading: false });
      });
    return () => {
      cancelled = true;
    };
  }, [workspace.id, selectedEntry, readFile, locale]);

  const activeCandidate = ranked.find((item) => item.path === selectedEntry) ?? ranked[0];

  return (
    <Dialog
      className="entry-picker-modal"
      onClose={onClose}
      title={isZh ? "選擇進入點檔案" : "Choose entry file"}
      titleId="entry-title"
      onSubmit={() => {
        if (selectedEntry) onConfirm(selectedEntry);
      }}
      intro={
        <div className="entry-picker-intro">
          <p className="entry-picker-desc">
            {isZh
              ? `「${workspace.rootLabel}」包含 ${workspace.entryCandidates.length} 個 .bp 程式檔，且尚未設定 kobrixa.json。請選擇要作為主程式編譯與執行的進入點：`
              : `“${workspace.rootLabel}” contains ${workspace.entryCandidates.length} .bp files without a kobrixa.json manifest. Select the main program file to build and run:`}
          </p>
        </div>
      }
    >
      <div className="entry-picker-body">
        {workspace.entryCandidates.length >= 4 && (
          <div className="entry-picker-search-wrap">
            <input
              type="search"
              className="entry-picker-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={
                isZh ? "搜尋檔案名稱或資料夾路徑…" : "Filter by file name or folder path…"
              }
              aria-label={isZh ? "搜尋進入點檔案" : "Filter entry files"}
            />
          </div>
        )}

        <div className="entry-picker-grid">
          <div className="entry-candidate-list" role="listbox" aria-labelledby="entry-title">
            {filtered.length === 0 ? (
              <div className="entry-candidate-empty">
                {isZh ? "找不到符合條件的 .bp 檔案" : "No matching .bp files"}
              </div>
            ) : (
              filtered.map((item, index) => {
                const isSelected = item.path === selectedEntry;
                return (
                  <button
                    key={item.path}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    data-modal-initial={index === 0 ? true : undefined}
                    className={`entry-candidate-item${isSelected ? " is-selected" : ""}${item.isRecommended ? " is-recommended" : ""}`}
                    onClick={() => onSelectEntry(item.path)}
                    onDoubleClick={() => {
                      onSelectEntry(item.path);
                      onConfirm(item.path);
                    }}
                  >
                    <div className="entry-candidate-main">
                      <span
                        className={`entry-candidate-radio${isSelected ? " is-checked" : ""}`}
                        aria-hidden="true"
                      />
                      <span className="entry-candidate-ext">BP</span>
                      <span className="entry-candidate-name">{item.fileName}</span>
                      {item.isRecommended && (
                        <span className="entry-candidate-badge is-primary">
                          {isZh ? "推薦主程式" : "Recommended"}
                        </span>
                      )}
                    </div>
                    <div className="entry-candidate-meta">
                      <span className="entry-candidate-path">
                        {item.directory ? `${item.directory}/${item.fileName}` : item.fileName}
                      </span>
                      <span className="entry-candidate-reason">{item.reasonLabel}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div className="entry-preview-pane" aria-live="polite">
            <div className="entry-preview-header">
              <div className="entry-preview-title-row">
                <span className="entry-preview-path">{activeCandidate?.path ?? selectedEntry}</span>
                {previewState.summary && (
                  <span className="entry-preview-lines">
                    {isZh
                      ? `共 ${previewState.summary.totalLines} 行`
                      : `${previewState.summary.totalLines} lines`}
                  </span>
                )}
              </div>
              {previewState.summary && previewState.summary.tags.length > 0 && (
                <div className="entry-preview-tags">
                  {previewState.summary.tags.map((tag) => (
                    <span key={tag} className="entry-preview-tag">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="entry-preview-code-wrap">
              {previewState.loading ? (
                <div className="entry-preview-placeholder">
                  {isZh ? "正在讀取程式碼預覽…" : "Loading code preview…"}
                </div>
              ) : previewState.summary &&
                previewState.summary.lines.length > 0 &&
                previewState.summary.totalLines > 0 ? (
                <pre className="entry-preview-code">
                  {previewState.summary.lines.map((line, idx) => (
                    <div key={idx} className="entry-preview-code-line">
                      <span className="entry-preview-ln">{idx + 1}</span>
                      <span className="entry-preview-text">{line || " "}</span>
                    </div>
                  ))}
                </pre>
              ) : (
                <div className="entry-preview-placeholder">
                  {isZh
                    ? "（此檔案目前為空或無預覽內容）"
                    : "(File is empty or preview unavailable)"}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <DialogActions>
        <button type="button" onClick={onClose}>
          {isZh ? "關閉" : "Close"}
        </button>
        <button className="primary" type="submit" disabled={!selectedEntry}>
          {isZh ? "設為主程式並開啟" : "Set as entry & open"}
        </button>
      </DialogActions>
    </Dialog>
  );
}
