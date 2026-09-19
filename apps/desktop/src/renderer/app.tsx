import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import kobrixaMark from "../../../../assets/brand/kobrixa-mark.svg";
import type {
  BuildEvent,
  DeviceDescriptor,
  DeviceEvent,
  Diagnostic,
  WorkspaceEntry,
  WorkspaceMutationResult,
  WorkspaceSummary,
} from "../shared/api.js";
import {
  Editor,
  type CursorPosition,
  type EditorFocusTarget,
  type EditorHandle,
} from "./editor.js";
import {
  LAYOUT_DEFAULTS,
  LAYOUT_LIMITS,
  LAYOUT_STORAGE_KEYS,
  activeFileAfterClose,
  activeFileAfterRemoval,
  clamp,
  nextDiagnosticIndex,
  readStoredBoolean,
  readStoredNumber,
  tabCloseDisposition,
} from "./editor-state.js";
import {
  buildFileTree,
  expandAncestors,
  flattenFileTree,
  pathContains,
  pathName,
  pathParent,
  remapTreePaths,
  selectionAfterRemoval,
} from "./file-tree.js";
import { ProjectTree, type ProjectTreeHandle } from "./project-tree.js";

type Locale = "en" | "zh-TW";
type Tab = { file: string; content: string; saved: string };
type PendingDraft = { workspaceId: string; file: string; content: string; timer: number };
type PendingCreate = { kind: WorkspaceEntry["kind"]; parent: string };

const copy = {
  en: {
    newProject: "New project",
    open: "Open",
    save: "Save",
    build: "Build",
    cancel: "Cancel",
    welcome: "Build ideas that move",
    intro: "Open a Basic Plus program or create a small EV3 project to begin.",
    files: "Project",
    diagnostics: "Diagnostics",
    devices: "EV3 device",
    discover: "Find EV3",
    connect: "Connect",
    disconnect: "Disconnect",
    upload: "Upload",
    run: "Run",
    stop: "Stop",
    remove: "Delete",
    address: "Wi-Fi address",
    noProblems: "No problems found.",
    ready: "Ready",
    selectDevice: "Select a discovered EV3",
    candidate: "v1 candidate",
    projectName: "Project name",
    projectNameHint: "Letters, numbers, dashes and underscores",
    create: "Create project",
    chooseEntry: "Choose entry file",
    continue: "Continue",
    close: "Cancel",
    format: "Format",
    previousProblem: "Previous problem",
    nextProblem: "Next problem",
    showFiles: "Show project",
    hideFiles: "Hide project",
    showDevice: "Show EV3 panel",
    hideDevice: "Hide EV3 panel",
    showProblems: "Show diagnostics",
    hideProblems: "Hide diagnostics",
    closeTab: "Close tab",
    unsavedTitle: "Save changes before closing?",
    unsavedBody: (file: string) => `${file} has changes that have not been saved to the project.`,
    saveAndClose: "Save and close",
    discardAndClose: "Discard changes",
    checking: "Checking…",
    errors: "errors",
    warnings: "warnings",
    chooseFile: "Choose a project file",
    saved: "Saved",
    unsaved: "Unsaved changes",
    editorLabel: "Code editor",
    line: "Ln",
    column: "Col",
    basicPlus: "BASIC PLUS",
    buildComplete: "Build complete",
    buildFailed: "Build failed",
    startingBuild: "Starting build…",
    savedStatus: "Saved",
    choosingLocation: "Choose a project location…",
    searching: "Searching for EV3…",
    devicesFound: (count: number) => `Found ${count} EV3 device(s)`,
    noDevice: "No EV3 found",
    actionComplete: (action: string) => `${action} complete`,
    resizeFiles: "Resize project panel",
    resizeDevice: "Resize EV3 panel",
    resizeProblems: "Resize diagnostics panel",
    fileTree: "Project files",
    newFile: "New file",
    newFolder: "New folder",
    moreActions: "More file actions",
    rename: "Rename",
    move: "Move…",
    moveTitle: "Move project item",
    moveDestination: "Destination folder",
    trash: "Move to Trash",
    trashTitle: "Move this item to Trash?",
    trashBody: (entry: string) => `${entry} will be removed from this project and moved to Trash.`,
    trashDirty: "Open unsaved changes inside it will be discarded.",
    entryName: "Name",
    entryParent: "Location",
    createFileTitle: "Create file",
    createFolderTitle: "Create folder",
    createEntryAction: "Create",
    expand: "Expand",
    collapse: "Collapse",
    manifestDirty: "Save or discard kobrixa.json changes before moving the build entry.",
    managingFiles: "Updating project files…",
  },
  "zh-TW": {
    newProject: "建立專案",
    open: "開啟",
    save: "儲存",
    build: "建置",
    cancel: "取消",
    welcome: "讓創意真正動起來",
    intro: "開啟 Basic Plus 程式，或建立一個 EV3 小專案開始使用。",
    files: "專案",
    diagnostics: "診斷",
    devices: "EV3 裝置",
    discover: "搜尋 EV3",
    connect: "連線",
    disconnect: "中斷",
    upload: "上傳",
    run: "執行",
    stop: "停止",
    remove: "刪除",
    address: "Wi-Fi 位址",
    noProblems: "沒有發現問題。",
    ready: "就緒",
    selectDevice: "選擇搜尋到的 EV3",
    candidate: "v1 候選版",
    projectName: "專案名稱",
    projectNameHint: "可使用英文字母、數字、連字號與底線",
    create: "建立專案",
    chooseEntry: "選擇進入點檔案",
    continue: "繼續",
    close: "取消",
    format: "格式化",
    previousProblem: "上一個問題",
    nextProblem: "下一個問題",
    showFiles: "顯示專案",
    hideFiles: "隱藏專案",
    showDevice: "顯示 EV3 面板",
    hideDevice: "隱藏 EV3 面板",
    showProblems: "顯示診斷",
    hideProblems: "隱藏診斷",
    closeTab: "關閉分頁",
    unsavedTitle: "關閉前要儲存變更嗎？",
    unsavedBody: (file: string) => `${file} 的變更尚未儲存到專案。`,
    saveAndClose: "儲存並關閉",
    discardAndClose: "捨棄變更",
    checking: "檢查中…",
    errors: "錯誤",
    warnings: "警告",
    chooseFile: "選擇專案檔案",
    saved: "已儲存",
    unsaved: "有未儲存變更",
    editorLabel: "程式碼編輯器",
    line: "行",
    column: "列",
    basicPlus: "BASIC PLUS",
    buildComplete: "建置完成",
    buildFailed: "建置失敗",
    startingBuild: "正在開始建置…",
    savedStatus: "已儲存",
    choosingLocation: "選擇專案存放位置…",
    searching: "正在搜尋 EV3…",
    devicesFound: (count: number) => `找到 ${count} 部 EV3 裝置`,
    noDevice: "找不到 EV3",
    actionComplete: (action: string) => `${action} 完成`,
    resizeFiles: "調整專案面板寬度",
    resizeDevice: "調整 EV3 面板寬度",
    resizeProblems: "調整診斷面板高度",
    fileTree: "專案檔案",
    newFile: "新增檔案",
    newFolder: "新增資料夾",
    moreActions: "更多檔案操作",
    rename: "重新命名",
    move: "移動…",
    moveTitle: "移動專案項目",
    moveDestination: "目的資料夾",
    trash: "移到垃圾桶",
    trashTitle: "要將此項目移到垃圾桶嗎？",
    trashBody: (entry: string) => `${entry} 將從專案移除並移到系統垃圾桶。`,
    trashDirty: "其中已開啟但尚未儲存的變更將被捨棄。",
    entryName: "名稱",
    entryParent: "位置",
    createFileTitle: "新增檔案",
    createFolderTitle: "新增資料夾",
    createEntryAction: "建立",
    expand: "展開",
    collapse: "收合",
    manifestDirty: "移動建置入口前，請先儲存或捨棄 kobrixa.json 的變更。",
    managingFiles: "正在更新專案檔案…",
  },
} as const;

export function App(): React.JSX.Element {
  const [locale, setLocale] = useState<Locale>(() =>
    navigator.language.toLowerCase().startsWith("zh") ? "zh-TW" : "en",
  );
  const t = copy[locale];
  const [workspace, setWorkspace] = useState<WorkspaceSummary>();
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeFile, setActiveFile] = useState<string>();
  const [liveDiagnostics, setLiveDiagnostics] = useState<Diagnostic[]>([]);
  const [buildDiagnostics, setBuildDiagnostics] = useState<Diagnostic[]>([]);
  const [status, setStatus] = useState<string>(t.ready);
  const [buildId, setBuildId] = useState<string>();
  const [building, setBuilding] = useState(false);
  const [devices, setDevices] = useState<DeviceDescriptor[]>([]);
  const [discovering, setDiscovering] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<string>();
  const [sessionId, setSessionId] = useState<string>();
  const [deviceState, setDeviceState] = useState("disconnected");
  const [wifiAddress, setWifiAddress] = useState("");
  const [focusTarget, setFocusTarget] = useState<EditorFocusTarget>();
  const [cursor, setCursor] = useState<CursorPosition>({ line: 1, column: 1 });
  const [diagnosticIndex, setDiagnosticIndex] = useState(-1);
  const [checking, setChecking] = useState(false);
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [projectName, setProjectName] = useState("my-robot");
  const [pendingWorkspace, setPendingWorkspace] = useState<WorkspaceSummary>();
  const [selectedEntry, setSelectedEntry] = useState("");
  const [pendingCloseFile, setPendingCloseFile] = useState<string>();
  const [closingTab, setClosingTab] = useState(false);
  const [selectedTreePath, setSelectedTreePath] = useState("");
  const [expandedTreePaths, setExpandedTreePaths] = useState<Set<string>>(() => new Set([""]));
  const [pendingCreate, setPendingCreate] = useState<PendingCreate>();
  const [entryName, setEntryName] = useState("");
  const [pendingMove, setPendingMove] = useState<string>();
  const [moveDestination, setMoveDestination] = useState("");
  const [pendingTrash, setPendingTrash] = useState<string>();
  const [managingEntries, setManagingEntries] = useState(false);
  const [filesOpen, setFilesOpen] = useState(() =>
    readStoredBoolean(
      window.localStorage,
      LAYOUT_STORAGE_KEYS.filesOpen,
      LAYOUT_DEFAULTS.filesOpen,
    ),
  );
  const [deviceOpen, setDeviceOpen] = useState(() =>
    readStoredBoolean(
      window.localStorage,
      LAYOUT_STORAGE_KEYS.deviceOpen,
      LAYOUT_DEFAULTS.deviceOpen,
    ),
  );
  const [problemsOpen, setProblemsOpen] = useState(() =>
    readStoredBoolean(
      window.localStorage,
      LAYOUT_STORAGE_KEYS.problemsOpen,
      LAYOUT_DEFAULTS.problemsOpen,
    ),
  );
  const [filesWidth, setFilesWidth] = useState(() =>
    readStoredNumber(
      window.localStorage,
      LAYOUT_STORAGE_KEYS.filesWidth,
      LAYOUT_DEFAULTS.filesWidth,
      LAYOUT_LIMITS.filesWidth.min,
      LAYOUT_LIMITS.filesWidth.max,
    ),
  );
  const [deviceWidth, setDeviceWidth] = useState(() =>
    readStoredNumber(
      window.localStorage,
      LAYOUT_STORAGE_KEYS.deviceWidth,
      LAYOUT_DEFAULTS.deviceWidth,
      LAYOUT_LIMITS.deviceWidth.min,
      LAYOUT_LIMITS.deviceWidth.max,
    ),
  );
  const [problemsHeight, setProblemsHeight] = useState(() =>
    readStoredNumber(
      window.localStorage,
      LAYOUT_STORAGE_KEYS.problemsHeight,
      LAYOUT_DEFAULTS.problemsHeight,
      LAYOUT_LIMITS.problemsHeight.min,
      500,
    ),
  );
  const editorRef = useRef<EditorHandle>(null);
  const treeRef = useRef<ProjectTreeHandle>(null);
  const workspaceRef = useRef<HTMLElement>(null);
  const centerRef = useRef<HTMLElement>(null);
  const activeTabRef = useRef<HTMLDivElement>(null);
  const focusRequest = useRef(0);
  const pendingDrafts = useRef(new Map<string, PendingDraft>());
  const draftWrites = useRef(new Map<string, Promise<void>>());
  const active = tabs.find((tab) => tab.file === activeFile);
  const dirty = tabs.some((tab) => tab.content !== tab.saved);
  const modalOpen = Boolean(
    newProjectOpen ||
    pendingWorkspace ||
    pendingCloseFile ||
    pendingCreate ||
    pendingMove ||
    pendingTrash,
  );
  const sourceOverlays = useMemo<Record<string, string>>(
    () =>
      Object.fromEntries([
        ...Object.entries(workspace?.drafts ?? {}).filter(([file]) =>
          /\.(bp|bpi|bpm)$/i.test(file),
        ),
        ...tabs
          .filter((tab) => /\.(bp|bpi|bpm)$/i.test(tab.file))
          .map((tab) => [tab.file, tab.content] as const),
      ]),
    [tabs, workspace?.drafts],
  );
  const diagnostics = useMemo(() => {
    const seen = new Set<string>();
    return [...liveDiagnostics, ...buildDiagnostics].filter((item) => {
      const key = `${item.code}\0${item.severity}\0${item.file}\0${item.range.startLine}\0${
        item.range.startColumn
      }\0${item.range.endLine}\0${item.range.endColumn}\0${item.message}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [buildDiagnostics, liveDiagnostics]);
  const errorCount = diagnostics.filter((item) => item.severity === "error").length;
  const warningCount = diagnostics.filter((item) => item.severity === "warning").length;
  const openFiles = useMemo(() => tabs.map((tab) => tab.file), [tabs]);
  const treeRoot = useMemo(
    () => buildFileTree(workspace?.rootLabel ?? "", workspace?.entries ?? []),
    [workspace?.entries, workspace?.rootLabel],
  );
  const visibleTreePaths = useMemo(
    () => flattenFileTree(treeRoot, expandedTreePaths).map((node) => node.path),
    [expandedTreePaths, treeRoot],
  );
  const moveDestinations = useMemo(
    () => [
      "",
      ...(workspace?.entries
        .filter(
          (entry) =>
            entry.kind === "directory" && !(pendingMove && pathContains(pendingMove, entry.path)),
        )
        .map((entry) => entry.path) ?? []),
    ],
    [pendingMove, workspace?.entries],
  );
  const workspaceStyle = {
    "--files-width": filesOpen ? `${filesWidth}px` : "0px",
    "--files-divider": filesOpen ? "5px" : "0px",
    "--device-width": deviceOpen ? `${deviceWidth}px` : "0px",
    "--device-divider": deviceOpen ? "5px" : "0px",
    "--problems-height": problemsOpen ? `${problemsHeight}px` : "36px",
    "--problems-divider": problemsOpen ? "5px" : "0px",
  } as CSSProperties;
  const remotePath = useMemo(() => {
    const name = (workspace?.name ?? "program").replace(/[^A-Za-z0-9_-]+/g, "_");
    return `/home/root/lms2012/prjs/${name}.rbf`;
  }, [workspace?.name]);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  useEffect(() => {
    window.localStorage.setItem(LAYOUT_STORAGE_KEYS.filesOpen, String(filesOpen));
    window.localStorage.setItem(LAYOUT_STORAGE_KEYS.deviceOpen, String(deviceOpen));
    window.localStorage.setItem(LAYOUT_STORAGE_KEYS.problemsOpen, String(problemsOpen));
    window.localStorage.setItem(LAYOUT_STORAGE_KEYS.filesWidth, String(filesWidth));
    window.localStorage.setItem(LAYOUT_STORAGE_KEYS.deviceWidth, String(deviceWidth));
    window.localStorage.setItem(LAYOUT_STORAGE_KEYS.problemsHeight, String(problemsHeight));
  }, [deviceOpen, deviceWidth, filesOpen, filesWidth, problemsHeight, problemsOpen]);

  useEffect(() => {
    const workspaceElement = workspaceRef.current;
    const centerElement = centerRef.current;
    if (!workspaceElement || !centerElement) return undefined;
    const fitLayout = (): void => {
      const dividers = (filesOpen ? 5 : 0) + (deviceOpen ? 5 : 0);
      const available = Math.max(0, workspaceElement.clientWidth - 420 - dividers);
      let nextFiles = filesOpen ? filesWidth : 0;
      let nextDevice = deviceOpen ? deviceWidth : 0;
      let overflow = Math.max(0, nextFiles + nextDevice - available);
      if (deviceOpen && overflow > 0) {
        const reduction = Math.min(overflow, nextDevice - LAYOUT_LIMITS.deviceWidth.min);
        nextDevice -= reduction;
        overflow -= reduction;
      }
      if (filesOpen && overflow > 0) {
        nextFiles -= Math.min(overflow, nextFiles - LAYOUT_LIMITS.filesWidth.min);
      }
      if (filesOpen && nextFiles !== filesWidth) setFilesWidth(nextFiles);
      if (deviceOpen && nextDevice !== deviceWidth) setDeviceWidth(nextDevice);
      const problemsMaximum = Math.max(
        LAYOUT_LIMITS.problemsHeight.min,
        Math.floor(centerElement.clientHeight * 0.45),
      );
      setProblemsHeight((value) => clamp(value, LAYOUT_LIMITS.problemsHeight.min, problemsMaximum));
    };
    fitLayout();
    const observer = new ResizeObserver(fitLayout);
    observer.observe(workspaceElement);
    observer.observe(centerElement);
    return () => observer.disconnect();
  }, [deviceOpen, deviceWidth, filesOpen, filesWidth, workspace?.id]);

  useEffect(() => {
    activeTabRef.current?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [activeFile]);

  useEffect(() => {
    if (!activeFile) return;
    setSelectedTreePath(activeFile);
    setExpandedTreePaths((current) => expandAncestors(current, activeFile));
  }, [activeFile]);

  useEffect(() => {
    if (diagnosticIndex >= diagnostics.length) setDiagnosticIndex(-1);
  }, [diagnosticIndex, diagnostics.length]);

  useEffect(() => {
    const stopBuild = window.kobrixa.build.onEvent((event: BuildEvent) => {
      if (event.type === "progress") setStatus(event.progress.message);
      else {
        setBuilding(false);
        setBuildId(event.buildId);
        setBuildDiagnostics(event.result.diagnostics);
        setStatus(event.result.success ? t.buildComplete : t.buildFailed);
      }
    });
    const stopDevice = window.kobrixa.device.onEvent((event: DeviceEvent) => {
      if (event.type === "state") {
        setDeviceState(event.state);
        if (event.sessionId) setSessionId(event.sessionId);
      } else setStatus(`${event.category}: ${event.message}`);
    });
    return () => {
      stopBuild();
      stopDevice();
    };
  }, [t]);

  useEffect(() => {
    const workspaceId = workspace?.id;
    if (!workspaceId) return undefined;
    let current = true;
    const timer = window.setTimeout(() => {
      setChecking(true);
      void window.kobrixa.language
        .diagnostics(workspaceId, sourceOverlays)
        .then((items) => {
          if (current) setLiveDiagnostics(items);
        })
        .catch((error: unknown) => {
          if (current) setStatus(error instanceof Error ? error.message : String(error));
        })
        .finally(() => {
          if (current) setChecking(false);
        });
    }, 300);
    return () => {
      current = false;
      window.clearTimeout(timer);
    };
  }, [sourceOverlays, workspace?.id]);

  useEffect(() => {
    const listener = (event: KeyboardEvent): void => {
      if (modalOpen) return;
      const modifier = event.metaKey || event.ctrlKey;
      const key = event.key.toLocaleLowerCase("en-US");
      const consume = (): void => {
        event.preventDefault();
        event.stopPropagation();
      };
      if (modifier && key === "s") {
        consume();
        void saveActive();
      } else if (modifier && key === "w" && activeFile) {
        consume();
        requestCloseTab(activeFile);
      } else if (modifier && key === "j") {
        consume();
        setProblemsOpen((value) => !value);
      } else if (modifier && key === "b") {
        consume();
        setFilesOpen((value) => !value);
      } else if (event.ctrlKey && key === "tab") {
        consume();
        cycleTabs(event.shiftKey ? -1 : 1);
      } else if (event.key === "F8") {
        consume();
        void navigateDiagnostics(event.shiftKey ? -1 : 1);
      } else if (event.altKey && event.shiftKey && key === "f") {
        consume();
        void editorRef.current?.format();
      }
    };
    window.addEventListener("keydown", listener, true);
    return () => window.removeEventListener("keydown", listener, true);
  });

  useEffect(
    () => () => {
      for (const item of pendingDrafts.current.values()) {
        window.clearTimeout(item.timer);
        void enqueueDraftWrite(item.workspaceId, item.file, item.content).catch(() => undefined);
      }
      pendingDrafts.current.clear();
    },
    [],
  );

  function draftKey(workspaceId: string, file: string): string {
    return `${workspaceId}\0${file}`;
  }

  function enqueueDraftWrite(
    workspaceId: string,
    file: string,
    content: string | undefined,
  ): Promise<void> {
    const key = draftKey(workspaceId, file);
    const previous = draftWrites.current.get(key) ?? Promise.resolve();
    const next = previous
      .catch(() => undefined)
      .then(() => window.kobrixa.workspace.saveDraft(workspaceId, file, content));
    draftWrites.current.set(key, next);
    next.then(
      () => {
        if (draftWrites.current.get(key) === next) draftWrites.current.delete(key);
      },
      () => {
        if (draftWrites.current.get(key) === next) draftWrites.current.delete(key);
      },
    );
    return next;
  }

  function queueDraft(workspaceId: string, file: string, content: string): void {
    const key = draftKey(workspaceId, file);
    const previous = pendingDrafts.current.get(key);
    if (previous) window.clearTimeout(previous.timer);
    const timer = window.setTimeout(() => {
      pendingDrafts.current.delete(key);
      void enqueueDraftWrite(workspaceId, file, content).catch(report);
    }, 400);
    pendingDrafts.current.set(key, { workspaceId, file, content, timer });
  }

  async function settleDraft(workspaceId: string, file: string): Promise<void> {
    const key = draftKey(workspaceId, file);
    const pending = pendingDrafts.current.get(key);
    if (pending) {
      window.clearTimeout(pending.timer);
      pendingDrafts.current.delete(key);
    }
    await draftWrites.current.get(key)?.catch(() => undefined);
  }

  async function flushAllDrafts(): Promise<void> {
    const pending = [...pendingDrafts.current.values()];
    for (const item of pending) {
      window.clearTimeout(item.timer);
      pendingDrafts.current.delete(draftKey(item.workspaceId, item.file));
    }
    await Promise.all([
      ...pending.map((item) => enqueueDraftWrite(item.workspaceId, item.file, item.content)),
      ...draftWrites.current.values(),
    ]);
  }

  function removeWorkspaceDraft(file: string): void {
    setWorkspace((current) => {
      if (!current || !(file in current.drafts)) return current;
      const drafts = { ...current.drafts };
      delete drafts[file];
      return { ...current, drafts };
    });
  }

  function closeTab(file: string): void {
    const nextActive = activeFileAfterClose(
      tabs.map((tab) => tab.file),
      file,
      activeFile,
    );
    setTabs((current) => current.filter((tab) => tab.file !== file));
    setActiveFile(nextActive);
    if (focusTarget?.file === file) setFocusTarget(undefined);
  }

  function requestCloseTab(file: string): void {
    const tab = tabs.find((item) => item.file === file);
    if (!tab) return;
    const disposition = tabCloseDisposition(tab.content !== tab.saved);
    if (disposition === "prompt") setPendingCloseFile(file);
    else closeTab(file);
  }

  async function resolveTabClose(action: "save" | "discard"): Promise<void> {
    if (!workspace || !pendingCloseFile) return;
    const file = pendingCloseFile;
    setClosingTab(true);
    try {
      if (action === "save") {
        const saved = await saveTab(file);
        if (!saved) return;
      } else {
        await settleDraft(workspace.id, file);
        await window.kobrixa.workspace.saveDraft(workspace.id, file, undefined);
        removeWorkspaceDraft(file);
      }
      closeTab(file);
      setPendingCloseFile(undefined);
    } catch (error) {
      report(error);
    } finally {
      setClosingTab(false);
    }
  }

  function cycleTabs(direction: 1 | -1): void {
    if (!tabs.length) return;
    const current = Math.max(
      0,
      tabs.findIndex((tab) => tab.file === activeFile),
    );
    const next = (current + direction + tabs.length) % tabs.length;
    setActiveFile(tabs[next]?.file);
  }

  async function navigateDiagnostics(direction: 1 | -1): Promise<void> {
    const next = nextDiagnosticIndex(diagnostics.length, diagnosticIndex, direction);
    if (next < 0) return;
    setDiagnosticIndex(next);
    await jumpTo(diagnostics[next]!, next);
  }

  async function adoptWorkspace(next: WorkspaceSummary | undefined): Promise<void> {
    if (!next) return;
    await flushAllDrafts();
    if (next.entryCandidates.length > 1) {
      setPendingWorkspace(next);
      setSelectedEntry(next.entryCandidates[0] ?? "");
      return;
    }
    await loadWorkspace(next);
  }

  async function loadWorkspace(selected: WorkspaceSummary): Promise<void> {
    setWorkspace(selected);
    setTabs([]);
    setActiveFile(undefined);
    setLiveDiagnostics([]);
    setBuildDiagnostics([]);
    setDiagnosticIndex(-1);
    setFocusTarget(undefined);
    setChecking(false);
    setCursor({ line: 1, column: 1 });
    setSelectedTreePath("");
    setExpandedTreePaths(new Set([""]));
    setPendingCreate(undefined);
    setPendingMove(undefined);
    setPendingTrash(undefined);
    const first =
      selected.manifest?.entry ??
      selected.files.find((file) => file.endsWith(".bp")) ??
      selected.files[0];
    if (first) await openFile(selected, first, true);
    if (first) window.requestAnimationFrame(() => editorRef.current?.focus());
  }

  async function createProject(): Promise<void> {
    const name = projectName.trim();
    if (!name) return;
    setNewProjectOpen(false);
    try {
      setStatus(t.choosingLocation);
      const next = await window.kobrixa.workspace.create(name);
      if (next) await adoptWorkspace(next);
      else setStatus(t.ready);
    } catch (error) {
      setNewProjectOpen(true);
      report(error);
    }
  }

  async function openProject(): Promise<void> {
    try {
      await adoptWorkspace(await window.kobrixa.workspace.open());
    } catch (error) {
      report(error);
    }
  }

  async function confirmEntry(): Promise<void> {
    if (!pendingWorkspace || !pendingWorkspace.entryCandidates.includes(selectedEntry)) return;
    try {
      const selected = await window.kobrixa.workspace.selectEntry(
        pendingWorkspace.id,
        selectedEntry,
      );
      setPendingWorkspace(undefined);
      await loadWorkspace(selected);
    } catch (error) {
      report(error);
    }
  }

  async function openFile(
    current: WorkspaceSummary,
    file: string,
    replaceTabs = false,
  ): Promise<void> {
    const existing = !replaceTabs && tabs.find((tab) => tab.file === file);
    if (existing) {
      setActiveFile(file);
      return;
    }
    try {
      const saved = await window.kobrixa.workspace.read(current.id, file);
      const content = current.drafts[file] ?? saved;
      setTabs((value) =>
        replaceTabs ? [{ file, content, saved }] : [...value, { file, content, saved }],
      );
      setActiveFile(file);
    } catch (error) {
      report(error);
    }
  }

  async function saveTab(file: string): Promise<boolean> {
    if (!workspace) return false;
    const tab = tabs.find((item) => item.file === file);
    if (!tab) return false;
    try {
      await settleDraft(workspace.id, file);
      await window.kobrixa.workspace.write(workspace.id, file, tab.content);
      setTabs((value) =>
        value.map((item) => (item.file === file ? { ...item, saved: item.content } : item)),
      );
      removeWorkspaceDraft(file);
      setStatus(t.savedStatus);
      return true;
    } catch (error) {
      report(error);
      return false;
    }
  }

  async function saveActive(): Promise<void> {
    if (activeFile) await saveTab(activeFile);
  }

  function updateActive(file: string, content: string): void {
    if (!workspace) return;
    setBuildDiagnostics([]);
    setTabs((value) => value.map((tab) => (tab.file === file ? { ...tab, content } : tab)));
    queueDraft(workspace.id, file, content);
  }

  function beginCreateEntry(kind: WorkspaceEntry["kind"], parent: string): void {
    setPendingCreate({ kind, parent });
    setEntryName(kind === "file" ? "untitled.bp" : "new-folder");
  }

  function requestMoveEntry(source: string): void {
    setPendingMove(source);
    setMoveDestination(pathParent(source));
  }

  function buildEntryMovesWith(source: string): boolean {
    const entry = workspace?.manifest?.entry;
    return Boolean(entry && pathContains(source, entry));
  }

  function manifestHasUnsavedChanges(): boolean {
    const manifest = tabs.find((tab) => tab.file === "kobrixa.json");
    return Boolean(
      (manifest && manifest.content !== manifest.saved) ||
      workspace?.drafts["kobrixa.json"] !== undefined,
    );
  }

  function applyMoveMutation(result: WorkspaceMutationResult, refreshedManifest?: string): void {
    const { moved } = result;
    editorRef.current?.remapFiles(moved);
    setWorkspace(result.workspace);
    setTabs((current) =>
      current.map((tab) => {
        const file = moved[tab.file] ?? tab.file;
        return file === "kobrixa.json" && refreshedManifest !== undefined
          ? { file, content: refreshedManifest, saved: refreshedManifest }
          : { ...tab, file };
      }),
    );
    setActiveFile((current) => (current ? (moved[current] ?? current) : current));
    setFocusTarget((current) =>
      current ? { ...current, file: moved[current.file] ?? current.file } : current,
    );
    const remapDiagnostic = (item: Diagnostic): Diagnostic => ({
      ...item,
      file: moved[item.file] ?? item.file,
    });
    setLiveDiagnostics((current) => current.map(remapDiagnostic));
    setBuildDiagnostics((current) => current.map(remapDiagnostic));
    setSelectedTreePath((current) => moved[current] ?? current);
    setExpandedTreePaths((current) => {
      const remapped = remapTreePaths(current, moved);
      const movedSelection = moved[selectedTreePath];
      return movedSelection ? expandAncestors(remapped, movedSelection) : remapped;
    });
    setBuildId(undefined);
  }

  async function moveManagedEntry(source: string, target: string): Promise<boolean> {
    if (!workspace) return false;
    if (buildEntryMovesWith(source) && manifestHasUnsavedChanges()) {
      setStatus(t.manifestDirty);
      return false;
    }
    setManagingEntries(true);
    setStatus(t.managingFiles);
    try {
      await flushAllDrafts();
      const result = await window.kobrixa.workspace.moveEntry(workspace.id, source, target);
      const refreshedManifest =
        buildEntryMovesWith(source) && !workspace.implicit
          ? await window.kobrixa.workspace.read(workspace.id, "kobrixa.json").catch(() => undefined)
          : undefined;
      applyMoveMutation(result, refreshedManifest);
      setStatus(t.ready);
      return true;
    } catch (error) {
      report(error);
      return false;
    } finally {
      setManagingEntries(false);
    }
  }

  async function renameManagedEntry(source: string, name: string): Promise<boolean> {
    const parent = pathParent(source);
    const target = parent ? `${parent}/${name.trim()}` : name.trim();
    return moveManagedEntry(source, target);
  }

  async function confirmCreateEntry(): Promise<void> {
    if (!workspace || !pendingCreate) return;
    const name = entryName.trim();
    if (!name) return;
    setManagingEntries(true);
    setStatus(t.managingFiles);
    try {
      const result = await window.kobrixa.workspace.createEntry(
        workspace.id,
        pendingCreate.parent,
        pendingCreate.kind,
        name,
      );
      const createdPath = pendingCreate.parent ? `${pendingCreate.parent}/${name}` : name;
      setWorkspace(result.workspace);
      setSelectedTreePath(createdPath);
      setExpandedTreePaths((current) => {
        const next = expandAncestors(current, createdPath);
        if (pendingCreate.kind === "directory") next.add(createdPath);
        return next;
      });
      if (pendingCreate.kind === "file") await openFile(result.workspace, createdPath);
      setPendingCreate(undefined);
      setStatus(t.ready);
      window.requestAnimationFrame(() => {
        if (pendingCreate.kind === "file") editorRef.current?.focus();
        else treeRef.current?.focus(createdPath);
      });
    } catch (error) {
      report(error);
    } finally {
      setManagingEntries(false);
    }
  }

  async function confirmMoveEntry(): Promise<void> {
    if (!pendingMove) return;
    const target = moveDestination
      ? `${moveDestination}/${pathName(pendingMove)}`
      : pathName(pendingMove);
    if (await moveManagedEntry(pendingMove, target)) {
      setPendingMove(undefined);
      window.requestAnimationFrame(() => treeRef.current?.focus(target));
    }
  }

  async function confirmTrashEntry(): Promise<void> {
    if (!workspace || !pendingTrash) return;
    setManagingEntries(true);
    setStatus(t.managingFiles);
    try {
      await flushAllDrafts();
      const result = await window.kobrixa.workspace.trashEntry(workspace.id, pendingTrash);
      const removed = new Set(result.removed);
      const remainingTabs = tabs.filter((tab) => !removed.has(tab.file));
      const nextActive = activeFileAfterRemoval(
        tabs.map((tab) => tab.file),
        activeFile,
        removed,
      );
      const nextTreeSelection = removed.has(selectedTreePath)
        ? selectionAfterRemoval(visibleTreePaths, selectedTreePath, removed)
        : selectedTreePath;
      const focusPath =
        activeFile && removed.has(activeFile) ? (nextActive ?? "") : nextTreeSelection;
      setWorkspace(result.workspace);
      setTabs(remainingTabs);
      setActiveFile(nextActive);
      setSelectedTreePath(focusPath);
      setExpandedTreePaths(
        (current) => new Set([...current].filter((entryPath) => !removed.has(entryPath))),
      );
      setLiveDiagnostics((current) => current.filter((item) => !removed.has(item.file)));
      setBuildDiagnostics((current) => current.filter((item) => !removed.has(item.file)));
      setFocusTarget((current) => (current && removed.has(current.file) ? undefined : current));
      setBuildId(undefined);
      setPendingTrash(undefined);
      setStatus(t.ready);
      window.requestAnimationFrame(() => treeRef.current?.focus(focusPath));
    } catch (error) {
      report(error);
    } finally {
      setManagingEntries(false);
    }
  }

  async function startBuild(): Promise<void> {
    if (!workspace) return;
    try {
      setBuilding(true);
      setBuildDiagnostics([]);
      setStatus(t.startingBuild);
      const id = await window.kobrixa.build.start(workspace.id, sourceOverlays);
      setBuildId(id);
    } catch (error) {
      setBuilding(false);
      report(error);
    }
  }

  async function discover(): Promise<void> {
    try {
      setDiscovering(true);
      setStatus(t.searching);
      const found = await window.kobrixa.device.discover();
      setDevices(found);
      setSelectedDevice(found[0]?.id);
      setStatus(found.length ? t.devicesFound(found.length) : t.noDevice);
    } catch (error) {
      report(error);
    } finally {
      setDiscovering(false);
    }
  }

  async function connect(): Promise<void> {
    try {
      const descriptor = devices.find((device) => device.id === selectedDevice);
      const id = descriptor
        ? await window.kobrixa.device.connect(descriptor)
        : await window.kobrixa.device.connectWifi(wifiAddress.trim());
      setSessionId(id);
    } catch (error) {
      report(error);
    }
  }

  async function deviceAction(action: "upload" | "run" | "stop" | "delete"): Promise<void> {
    if (!sessionId) return;
    try {
      if (action === "upload") {
        if (!buildId) throw new Error("Build the project successfully before uploading.");
        await window.kobrixa.device.deploy(
          sessionId,
          buildId,
          remotePath.slice(0, remotePath.lastIndexOf("/")),
        );
      } else if (action === "run") await window.kobrixa.device.run(sessionId, remotePath);
      else if (action === "stop") await window.kobrixa.device.stop(sessionId);
      else await window.kobrixa.device.delete(sessionId, remotePath);
      setStatus(t.actionComplete(action));
    } catch (error) {
      report(error);
    }
  }

  function report(error: unknown): void {
    setStatus(error instanceof Error ? error.message : String(error));
  }

  function sidebarMaximum(side: "files" | "device"): number {
    const workspaceWidth = workspaceRef.current?.clientWidth ?? window.innerWidth;
    const otherWidth =
      side === "files" ? (deviceOpen ? deviceWidth : 0) : filesOpen ? filesWidth : 0;
    const dividerWidth = (filesOpen ? 5 : 0) + (deviceOpen ? 5 : 0);
    const limit = side === "files" ? LAYOUT_LIMITS.filesWidth : LAYOUT_LIMITS.deviceWidth;
    return Math.max(
      limit.min,
      Math.min(limit.max, workspaceWidth - 420 - otherWidth - dividerWidth),
    );
  }

  function beginSidebarResize(
    side: "files" | "device",
    event: React.PointerEvent<HTMLDivElement>,
  ): void {
    event.currentTarget.focus();
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = side === "files" ? filesWidth : deviceWidth;
    const limit = side === "files" ? LAYOUT_LIMITS.filesWidth : LAYOUT_LIMITS.deviceWidth;
    const maximum = sidebarMaximum(side);
    document.body.classList.add("is-resizing-horizontal");
    const move = (pointerEvent: PointerEvent): void => {
      const delta = pointerEvent.clientX - startX;
      const next = clamp(startWidth + (side === "files" ? delta : -delta), limit.min, maximum);
      if (side === "files") setFilesWidth(next);
      else setDeviceWidth(next);
    };
    const finish = (): void => {
      document.body.classList.remove("is-resizing-horizontal");
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", finish);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", finish);
    window.addEventListener("pointercancel", finish);
  }

  function resizeSidebarWithKeyboard(
    side: "files" | "device",
    event: React.KeyboardEvent<HTMLDivElement>,
  ): void {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const direction = event.key === "ArrowRight" ? 1 : -1;
    const current = side === "files" ? filesWidth : deviceWidth;
    const limit = side === "files" ? LAYOUT_LIMITS.filesWidth : LAYOUT_LIMITS.deviceWidth;
    const delta = side === "files" ? direction * 16 : direction * -16;
    const next = clamp(current + delta, limit.min, sidebarMaximum(side));
    if (side === "files") setFilesWidth(next);
    else setDeviceWidth(next);
  }

  function problemsMaximum(): number {
    return Math.max(
      LAYOUT_LIMITS.problemsHeight.min,
      Math.floor((centerRef.current?.clientHeight ?? 640) * 0.45),
    );
  }

  function beginProblemsResize(event: React.PointerEvent<HTMLDivElement>): void {
    event.currentTarget.focus();
    event.preventDefault();
    const startY = event.clientY;
    const startHeight = problemsHeight;
    const maximum = problemsMaximum();
    document.body.classList.add("is-resizing-vertical");
    const move = (pointerEvent: PointerEvent): void =>
      setProblemsHeight(
        clamp(
          startHeight + startY - pointerEvent.clientY,
          LAYOUT_LIMITS.problemsHeight.min,
          maximum,
        ),
      );
    const finish = (): void => {
      document.body.classList.remove("is-resizing-vertical");
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", finish);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", finish);
    window.addEventListener("pointercancel", finish);
  }

  function resizeProblemsWithKeyboard(event: React.KeyboardEvent<HTMLDivElement>): void {
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
    event.preventDefault();
    setProblemsHeight((value) =>
      clamp(
        value + (event.key === "ArrowUp" ? 16 : -16),
        LAYOUT_LIMITS.problemsHeight.min,
        problemsMaximum(),
      ),
    );
  }

  async function jumpTo(item: Diagnostic, index?: number): Promise<void> {
    if (!workspace) return;
    if (workspace.files.includes(item.file)) await openFile(workspace, item.file);
    if (index !== undefined) setDiagnosticIndex(index);
    setFocusTarget({ file: item.file, range: item.range, requestId: ++focusRequest.current });
    setProblemsOpen(true);
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <img className="brand-mark" src={kobrixaMark} alt="" aria-hidden="true" />
          <span>Kobrixa</span>
          <small>{t.candidate}</small>
        </div>
        <nav className="actions">
          <button
            onClick={() => {
              setProjectName("my-robot");
              setNewProjectOpen(true);
            }}
          >
            {t.newProject}
          </button>
          <button onClick={() => void openProject()}>{t.open}</button>
          <button
            disabled={!active || active.content === active.saved}
            onClick={() => void saveActive()}
          >
            {t.save}
          </button>
          <span className="divider" />
          <button
            className="primary"
            disabled={!workspace || building}
            onClick={() => void startBuild()}
          >
            {t.build}
          </button>
          <button
            disabled={!building || !buildId}
            onClick={() => buildId && void window.kobrixa.build.cancel(buildId)}
          >
            {t.cancel}
          </button>
        </nav>
        <button
          className="locale"
          onClick={() => setLocale((value) => (value === "en" ? "zh-TW" : "en"))}
        >
          {locale === "en" ? "繁中" : "EN"}
        </button>
      </header>

      {!workspace ? (
        <section className="welcome">
          <div className="orb">
            <span>EV3</span>
          </div>
          <p className="eyebrow">KOBRIXA IDE</p>
          <h1>{t.welcome}</h1>
          <p>{t.intro}</p>
          <div className="welcome-actions">
            <button className="primary large" onClick={() => void openProject()}>
              {t.open}
            </button>
            <button
              className="large"
              onClick={() => {
                setProjectName("my-robot");
                setNewProjectOpen(true);
              }}
            >
              {t.newProject}
            </button>
          </div>
        </section>
      ) : (
        <section className="workspace" ref={workspaceRef} style={workspaceStyle}>
          <aside
            className={`sidebar files-panel ${filesOpen ? "" : "collapsed"}`}
            aria-hidden={!filesOpen}
          >
            {filesOpen && (
              <>
                <h2>{t.files}</h2>
                <ProjectTree
                  ref={treeRef}
                  activeFile={activeFile}
                  buildEntry={workspace.manifest?.entry}
                  busy={managingEntries}
                  copy={{
                    treeLabel: t.fileTree,
                    newFile: t.newFile,
                    newFolder: t.newFolder,
                    moreActions: t.moreActions,
                    rename: t.rename,
                    move: t.move,
                    trash: t.trash,
                    expand: t.expand,
                    collapse: t.collapse,
                  }}
                  entries={workspace.entries}
                  expandedPaths={expandedTreePaths}
                  rootLabel={workspace.rootLabel}
                  selectedPath={selectedTreePath}
                  onCreate={beginCreateEntry}
                  onExpandedPaths={setExpandedTreePaths}
                  onMove={async (source, target) => {
                    await moveManagedEntry(source, target);
                  }}
                  onMoveRequest={requestMoveEntry}
                  onOpenFile={(file) => void openFile(workspace, file)}
                  onRename={renameManagedEntry}
                  onSelectedPath={setSelectedTreePath}
                  onTrash={setPendingTrash}
                />
              </>
            )}
          </aside>
          <div
            className="resize-handle resize-files"
            role="separator"
            aria-label={t.resizeFiles}
            aria-orientation="vertical"
            aria-valuemin={LAYOUT_LIMITS.filesWidth.min}
            aria-valuemax={sidebarMaximum("files")}
            aria-valuenow={filesWidth}
            aria-hidden={!filesOpen}
            tabIndex={filesOpen ? 0 : -1}
            onDoubleClick={() => setFilesWidth(LAYOUT_DEFAULTS.filesWidth)}
            onKeyDown={(event) => resizeSidebarWithKeyboard("files", event)}
            onPointerDown={(event) => beginSidebarResize("files", event)}
          />

          <section className="center" ref={centerRef}>
            <div className="editor-toolbar">
              <button
                aria-pressed={filesOpen}
                title={filesOpen ? t.hideFiles : t.showFiles}
                onClick={() => setFilesOpen((value) => !value)}
              >
                <span aria-hidden="true">☰</span>
                {t.files}
              </button>
              <div className="breadcrumb" title={active?.file}>
                {active?.file ?? workspace.name}
              </div>
              <div className="editor-tools">
                <button
                  disabled={!active}
                  title={`${t.format} · Shift+Alt/Option+F`}
                  onClick={() => void editorRef.current?.format()}
                >
                  {t.format}
                </button>
                <button
                  className="icon-button"
                  disabled={!diagnostics.length}
                  aria-label={t.previousProblem}
                  title={`${t.previousProblem} · Shift+F8`}
                  onClick={() => void navigateDiagnostics(-1)}
                >
                  ↑
                </button>
                <button
                  className="icon-button"
                  disabled={!diagnostics.length}
                  aria-label={t.nextProblem}
                  title={`${t.nextProblem} · F8`}
                  onClick={() => void navigateDiagnostics(1)}
                >
                  ↓
                </button>
                <button
                  aria-pressed={problemsOpen}
                  title={problemsOpen ? t.hideProblems : t.showProblems}
                  onClick={() => setProblemsOpen((value) => !value)}
                >
                  {t.diagnostics}
                  {diagnostics.length > 0 && <strong>{diagnostics.length}</strong>}
                </button>
                <button
                  aria-pressed={deviceOpen}
                  title={deviceOpen ? t.hideDevice : t.showDevice}
                  onClick={() => setDeviceOpen((value) => !value)}
                >
                  EV3
                </button>
              </div>
            </div>

            <div className="tabs" role="tablist" aria-label={t.files}>
              {tabs.map((tab) => {
                const selected = tab.file === activeFile;
                const tabDirty = tab.content !== tab.saved;
                return (
                  <div
                    className={`tab ${selected ? "active" : ""}`}
                    key={tab.file}
                    ref={selected ? activeTabRef : undefined}
                  >
                    <button
                      className="tab-select"
                      role="tab"
                      aria-selected={selected}
                      title={tab.file}
                      onClick={() => {
                        setActiveFile(tab.file);
                        window.requestAnimationFrame(() => editorRef.current?.focus());
                      }}
                    >
                      <span className="tab-kind">
                        {tab.file.split(".").pop()?.toLocaleUpperCase("en-US")}
                      </span>
                      <span className="tab-name">{tab.file}</span>
                      {tabDirty && <i aria-label={t.unsaved}>●</i>}
                    </button>
                    <button
                      className="tab-close"
                      aria-label={`${t.closeTab}: ${tab.file}`}
                      title={`${t.closeTab} · Mod+W`}
                      onClick={() => requestCloseTab(tab.file)}
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="editor-stage">
              {active ? (
                <Editor
                  ref={editorRef}
                  file={active.file}
                  value={active.content}
                  openFiles={openFiles}
                  diagnostics={diagnostics}
                  focusTarget={focusTarget}
                  ariaLabel={t.editorLabel}
                  onChange={updateActive}
                  onCursorChange={setCursor}
                />
              ) : (
                <div className="empty">{t.chooseFile}</div>
              )}
            </div>

            <div
              className="resize-handle resize-problems"
              role="separator"
              aria-label={t.resizeProblems}
              aria-orientation="horizontal"
              aria-valuemin={LAYOUT_LIMITS.problemsHeight.min}
              aria-valuemax={problemsMaximum()}
              aria-valuenow={problemsHeight}
              aria-hidden={!problemsOpen}
              tabIndex={problemsOpen ? 0 : -1}
              onDoubleClick={() => setProblemsHeight(LAYOUT_DEFAULTS.problemsHeight)}
              onKeyDown={resizeProblemsWithKeyboard}
              onPointerDown={beginProblemsResize}
            />
            <section className={`problems ${problemsOpen ? "" : "collapsed"}`}>
              <div className="problems-header">
                <button
                  aria-expanded={problemsOpen}
                  title={problemsOpen ? t.hideProblems : t.showProblems}
                  onClick={() => setProblemsOpen((value) => !value)}
                >
                  <span aria-hidden="true">{problemsOpen ? "⌄" : "›"}</span>
                  {t.diagnostics}
                  <strong>{diagnostics.length}</strong>
                </button>
                <div className="diagnostic-summary" aria-live="polite">
                  {checking && <span className="checking">{t.checking}</span>}
                  <span className="error-count">
                    {errorCount} {t.errors}
                  </span>
                  <span className="warning-count">
                    {warningCount} {t.warnings}
                  </span>
                </div>
              </div>
              {problemsOpen && (
                <div className="problem-list">
                  {diagnostics.length ? (
                    diagnostics.map((item, index) => (
                      <button
                        className={index === diagnosticIndex ? "active" : ""}
                        key={`${item.code}-${item.file}-${item.range.startLine}-${item.range.startColumn}-${index}`}
                        onClick={() => void jumpTo(item, index)}
                      >
                        <b className={item.severity}>{item.code}</b>
                        <span>{item.message}</span>
                        <small>
                          {item.file}:{item.range.startLine}:{item.range.startColumn}
                        </small>
                      </button>
                    ))
                  ) : (
                    <p>{checking ? t.checking : t.noProblems}</p>
                  )}
                </div>
              )}
            </section>
          </section>

          <div
            className="resize-handle resize-device"
            role="separator"
            aria-label={t.resizeDevice}
            aria-orientation="vertical"
            aria-valuemin={LAYOUT_LIMITS.deviceWidth.min}
            aria-valuemax={sidebarMaximum("device")}
            aria-valuenow={deviceWidth}
            aria-hidden={!deviceOpen}
            tabIndex={deviceOpen ? 0 : -1}
            onDoubleClick={() => setDeviceWidth(LAYOUT_DEFAULTS.deviceWidth)}
            onKeyDown={(event) => resizeSidebarWithKeyboard("device", event)}
            onPointerDown={(event) => beginSidebarResize("device", event)}
          />
          <aside
            className={`sidebar device-panel ${deviceOpen ? "" : "collapsed"}`}
            aria-hidden={!deviceOpen}
          >
            {deviceOpen && (
              <>
                <div className="device-title">
                  <h2>{t.devices}</h2>
                  <span className={`state ${deviceState}`}>{deviceState}</span>
                </div>
                <div className="brick">
                  <div className="brick-screen">
                    EV3
                    <br />
                    <small>{deviceState}</small>
                  </div>
                  <div className="brick-buttons">◆</div>
                </div>
                <button className="wide" disabled={discovering} onClick={() => void discover()}>
                  {discovering ? t.searching : t.discover}
                </button>
                {devices.length > 0 && (
                  <select
                    value={selectedDevice}
                    onChange={(event) => setSelectedDevice(event.target.value)}
                  >
                    {devices.map((device) => (
                      <option key={device.id} value={device.id}>
                        {device.name} · {device.transport}
                      </option>
                    ))}
                  </select>
                )}
                <label>
                  {t.address}
                  <input
                    placeholder="192.168.0.42"
                    value={wifiAddress}
                    onChange={(event) => {
                      setWifiAddress(event.target.value);
                      setSelectedDevice(undefined);
                    }}
                  />
                </label>
                {!sessionId ? (
                  <button
                    className="primary wide"
                    disabled={!selectedDevice && !wifiAddress.trim()}
                    onClick={() => void connect()}
                  >
                    {t.connect}
                  </button>
                ) : (
                  <button
                    className="wide"
                    onClick={() =>
                      void window.kobrixa.device
                        .disconnect(sessionId)
                        .then(() => setSessionId(undefined))
                    }
                  >
                    {t.disconnect}
                  </button>
                )}
                <div className="device-actions">
                  <button
                    disabled={!sessionId || !buildId}
                    onClick={() => void deviceAction("upload")}
                  >
                    {t.upload}
                  </button>
                  <button disabled={!sessionId} onClick={() => void deviceAction("run")}>
                    {t.run}
                  </button>
                  <button disabled={!sessionId} onClick={() => void deviceAction("stop")}>
                    {t.stop}
                  </button>
                  <button disabled={!sessionId} onClick={() => void deviceAction("delete")}>
                    {t.remove}
                  </button>
                </div>
                <p className="remote-path">{remotePath}</p>
              </>
            )}
          </aside>
        </section>
      )}
      {newProjectOpen && (
        <div className="modal-backdrop">
          <form
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-project-title"
            onSubmit={(event) => {
              event.preventDefault();
              void createProject();
            }}
          >
            <h2 id="new-project-title">{t.newProject}</h2>
            <label>
              {t.projectName}
              <input
                autoFocus
                maxLength={80}
                value={projectName}
                onChange={(event) => setProjectName(event.target.value)}
              />
              <small>{t.projectNameHint}</small>
            </label>
            <div className="modal-actions">
              <button type="button" onClick={() => setNewProjectOpen(false)}>
                {t.close}
              </button>
              <button className="primary" type="submit" disabled={!projectName.trim()}>
                {t.create}
              </button>
            </div>
          </form>
        </div>
      )}
      {pendingWorkspace && (
        <div className="modal-backdrop">
          <form
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="entry-title"
            onSubmit={(event) => {
              event.preventDefault();
              void confirmEntry();
            }}
          >
            <h2 id="entry-title">{t.chooseEntry}</h2>
            <select
              value={selectedEntry}
              onChange={(event) => setSelectedEntry(event.target.value)}
            >
              {pendingWorkspace.entryCandidates.map((entry) => (
                <option key={entry} value={entry}>
                  {entry}
                </option>
              ))}
            </select>
            <div className="modal-actions">
              <button type="button" onClick={() => setPendingWorkspace(undefined)}>
                {t.close}
              </button>
              <button className="primary" type="submit" disabled={!selectedEntry}>
                {t.continue}
              </button>
            </div>
          </form>
        </div>
      )}
      {pendingCreate && (
        <div className="modal-backdrop">
          <form
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-entry-title"
            onSubmit={(event) => {
              event.preventDefault();
              void confirmCreateEntry();
            }}
          >
            <h2 id="create-entry-title">
              {pendingCreate.kind === "file" ? t.createFileTitle : t.createFolderTitle}
            </h2>
            <p className="modal-path">
              {t.entryParent}: {pendingCreate.parent || workspace?.rootLabel}
            </p>
            <label>
              {t.entryName}
              <input
                autoFocus
                maxLength={255}
                value={entryName}
                onChange={(event) => setEntryName(event.target.value)}
              />
            </label>
            <div className="modal-actions">
              <button
                type="button"
                disabled={managingEntries}
                onClick={() => setPendingCreate(undefined)}
              >
                {t.close}
              </button>
              <button
                className="primary"
                type="submit"
                disabled={managingEntries || !entryName.trim()}
              >
                {t.createEntryAction}
              </button>
            </div>
          </form>
        </div>
      )}
      {pendingMove && (
        <div className="modal-backdrop">
          <form
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="move-entry-title"
            onSubmit={(event) => {
              event.preventDefault();
              void confirmMoveEntry();
            }}
          >
            <h2 id="move-entry-title">{t.moveTitle}</h2>
            <p className="modal-path">{pendingMove}</p>
            <label>
              {t.moveDestination}
              <select
                autoFocus
                value={moveDestination}
                onChange={(event) => setMoveDestination(event.target.value)}
              >
                {moveDestinations.map((directory) => (
                  <option key={directory || "root"} value={directory}>
                    {directory || workspace?.rootLabel}
                  </option>
                ))}
              </select>
            </label>
            <div className="modal-actions">
              <button
                type="button"
                disabled={managingEntries}
                onClick={() => setPendingMove(undefined)}
              >
                {t.close}
              </button>
              <button className="primary" type="submit" disabled={managingEntries}>
                {t.move}
              </button>
            </div>
          </form>
        </div>
      )}
      {pendingTrash && (
        <div className="modal-backdrop">
          <div
            className="modal-card"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="trash-entry-title"
            aria-describedby="trash-entry-description"
          >
            <h2 id="trash-entry-title">{t.trashTitle}</h2>
            <p id="trash-entry-description" className="modal-description">
              {t.trashBody(pendingTrash)}
            </p>
            {tabs.some(
              (tab) => pathContains(pendingTrash, tab.file) && tab.content !== tab.saved,
            ) && <p className="modal-warning">{t.trashDirty}</p>}
            <div className="modal-actions">
              <button
                autoFocus
                type="button"
                disabled={managingEntries}
                onClick={() => setPendingTrash(undefined)}
              >
                {t.close}
              </button>
              <button
                className="danger"
                type="button"
                disabled={managingEntries}
                onClick={() => void confirmTrashEntry()}
              >
                {t.trash}
              </button>
            </div>
          </div>
        </div>
      )}
      {pendingCloseFile && (
        <div className="modal-backdrop">
          <div
            className="modal-card"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="close-tab-title"
            aria-describedby="close-tab-description"
          >
            <h2 id="close-tab-title">{t.unsavedTitle}</h2>
            <p id="close-tab-description" className="modal-description">
              {t.unsavedBody(pendingCloseFile)}
            </p>
            <div className="modal-actions three-actions">
              <button
                type="button"
                disabled={closingTab}
                onClick={() => setPendingCloseFile(undefined)}
              >
                {t.close}
              </button>
              <button
                className="danger"
                type="button"
                disabled={closingTab}
                onClick={() => void resolveTabClose("discard")}
              >
                {t.discardAndClose}
              </button>
              <button
                autoFocus
                className="primary"
                type="button"
                disabled={closingTab}
                onClick={() => void resolveTabClose("save")}
              >
                {t.saveAndClose}
              </button>
            </div>
          </div>
        </div>
      )}
      <footer>
        <div className="status-group">
          {active ? (
            <span className={active.content !== active.saved ? "dirty" : ""}>
              {active.content !== active.saved ? `● ${t.unsaved}` : `✓ ${t.saved}`}
            </span>
          ) : (
            <span>{workspace ? t.ready : "Kobrixa"}</span>
          )}
          {dirty && active?.content === active?.saved && <span className="dirty">●</span>}
        </div>
        <span className="operation-status" role="status">
          {checking ? t.checking : status}
        </span>
        <div className="status-group status-details">
          {active && (
            <>
              <span>
                {t.line} {cursor.line}, {t.column} {cursor.column}
              </span>
              <span>
                {active.file.toLocaleLowerCase("en-US").endsWith(".json") ? "JSON" : t.basicPlus}
              </span>
            </>
          )}
          <span>{workspace?.manifest?.target ?? "ev3-native"}</span>
        </div>
      </footer>
    </main>
  );
}
