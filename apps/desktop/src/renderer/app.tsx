import { useEffect, useMemo, useState } from "react";
import type {
  BuildEvent,
  DeviceDescriptor,
  DeviceEvent,
  Diagnostic,
  WorkspaceSummary,
} from "../shared/api.js";
import { Editor } from "./editor.js";

type Locale = "en" | "zh-TW";
type Tab = { file: string; content: string; saved: string };

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
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([]);
  const [status, setStatus] = useState<string>(t.ready);
  const [buildId, setBuildId] = useState<string>();
  const [building, setBuilding] = useState(false);
  const [devices, setDevices] = useState<DeviceDescriptor[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>();
  const [sessionId, setSessionId] = useState<string>();
  const [deviceState, setDeviceState] = useState("disconnected");
  const [wifiAddress, setWifiAddress] = useState("");
  const [focusLine, setFocusLine] = useState<number>();
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [projectName, setProjectName] = useState("my-robot");
  const [pendingWorkspace, setPendingWorkspace] = useState<WorkspaceSummary>();
  const [selectedEntry, setSelectedEntry] = useState("");
  const active = tabs.find((tab) => tab.file === activeFile);
  const dirty = tabs.some((tab) => tab.content !== tab.saved);
  const remotePath = useMemo(() => {
    const name = (workspace?.name ?? "program").replace(/[^A-Za-z0-9_-]+/g, "_");
    return `/home/root/lms2012/prjs/${name}.rbf`;
  }, [workspace?.name]);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  useEffect(() => {
    const stopBuild = window.kobrixa.build.onEvent((event: BuildEvent) => {
      if (event.type === "progress") setStatus(event.progress.message);
      else {
        setBuilding(false);
        setBuildId(event.buildId);
        setDiagnostics(event.result.diagnostics);
        setStatus(event.result.success ? "Build complete" : "Build failed");
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
  }, []);

  useEffect(() => {
    const listener = (event: KeyboardEvent): void => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void saveActive();
      }
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  });

  async function adoptWorkspace(next: WorkspaceSummary | undefined): Promise<void> {
    if (!next) return;
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
    setDiagnostics([]);
    const first =
      selected.manifest?.entry ??
      selected.files.find((file) => file.endsWith(".bp")) ??
      selected.files[0];
    if (first) await openFile(selected, first);
  }

  async function createProject(): Promise<void> {
    const name = projectName.trim();
    if (!name) return;
    setNewProjectOpen(false);
    try {
      setStatus(locale === "zh-TW" ? "選擇專案存放位置…" : "Choose a project location…");
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

  async function openFile(current: WorkspaceSummary, file: string): Promise<void> {
    const existing = tabs.find((tab) => tab.file === file);
    if (existing) {
      setActiveFile(file);
      return;
    }
    try {
      const saved = await window.kobrixa.workspace.read(current.id, file);
      const content = current.drafts[file] ?? saved;
      setTabs((value) => [...value, { file, content, saved }]);
      setActiveFile(file);
    } catch (error) {
      report(error);
    }
  }

  async function saveActive(): Promise<void> {
    if (!workspace || !active) return;
    try {
      await window.kobrixa.workspace.write(workspace.id, active.file, active.content);
      setTabs((value) =>
        value.map((tab) => (tab.file === active.file ? { ...tab, saved: tab.content } : tab)),
      );
      setStatus("Saved");
    } catch (error) {
      report(error);
    }
  }

  function updateActive(content: string): void {
    if (!workspace || !activeFile) return;
    setTabs((value) => value.map((tab) => (tab.file === activeFile ? { ...tab, content } : tab)));
    window.clearTimeout(Number(document.body.dataset.draftTimer ?? 0));
    const timer = window.setTimeout(
      () => void window.kobrixa.workspace.saveDraft(workspace.id, activeFile, content),
      400,
    );
    document.body.dataset.draftTimer = String(timer);
  }

  async function startBuild(): Promise<void> {
    if (!workspace) return;
    try {
      setBuilding(true);
      setDiagnostics([]);
      setStatus("Starting build…");
      const overlays = Object.fromEntries(
        tabs
          .filter((tab) => /\.(bp|bpi|bpm)$/i.test(tab.file))
          .map((tab) => [tab.file, tab.content]),
      );
      const id = await window.kobrixa.build.start(workspace.id, overlays);
      setBuildId(id);
    } catch (error) {
      setBuilding(false);
      report(error);
    }
  }

  async function discover(): Promise<void> {
    try {
      setStatus("Searching for EV3…");
      const found = await window.kobrixa.device.discover();
      setDevices(found);
      setSelectedDevice(found[0]?.id);
      setStatus(found.length ? `Found ${found.length} EV3 device(s)` : "No EV3 found");
    } catch (error) {
      report(error);
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
        await window.kobrixa.device.upload(sessionId, buildId, remotePath);
      } else if (action === "run") await window.kobrixa.device.run(sessionId, remotePath);
      else if (action === "stop") await window.kobrixa.device.stop(sessionId);
      else await window.kobrixa.device.delete(sessionId, remotePath);
      setStatus(`${action} complete`);
    } catch (error) {
      report(error);
    }
  }

  function report(error: unknown): void {
    setStatus(error instanceof Error ? error.message : String(error));
  }

  async function jumpTo(item: Diagnostic): Promise<void> {
    if (!workspace) return;
    if (workspace.files.includes(item.file)) await openFile(workspace, item.file);
    setFocusLine(item.range.startLine);
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">K</span>
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
        <section className="workspace">
          <aside className="sidebar files-panel">
            <h2>{t.files}</h2>
            <p className="project-name">{workspace.name}</p>
            <div className="file-list">
              {workspace.files.map((file) => (
                <button
                  className={file === activeFile ? "active" : ""}
                  key={file}
                  onClick={() => void openFile(workspace, file)}
                >
                  <span>◇</span>
                  {file}
                </button>
              ))}
            </div>
          </aside>

          <section className="center">
            <div className="tabs">
              {tabs.map((tab) => (
                <button
                  className={tab.file === activeFile ? "active" : ""}
                  key={tab.file}
                  onClick={() => setActiveFile(tab.file)}
                >
                  {tab.file}
                  {tab.content !== tab.saved && <i>●</i>}
                </button>
              ))}
            </div>
            {active ? (
              <Editor
                file={active.file}
                value={active.content}
                diagnostics={diagnostics}
                focusLine={focusLine}
                onChange={updateActive}
              />
            ) : (
              <div className="empty">Choose a file</div>
            )}
            <div className="problems">
              <h2>
                {t.diagnostics}
                <span>{diagnostics.length}</span>
              </h2>
              <div className="problem-list">
                {diagnostics.length ? (
                  diagnostics.map((item, index) => (
                    <button key={`${item.code}-${index}`} onClick={() => void jumpTo(item)}>
                      <b className={item.severity}>{item.code}</b>
                      <span>{item.message}</span>
                      <small>
                        {item.file}:{item.range.startLine}:{item.range.startColumn}
                      </small>
                    </button>
                  ))
                ) : (
                  <p>{t.noProblems}</p>
                )}
              </div>
            </div>
          </section>

          <aside className="sidebar device-panel">
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
            <button className="wide" onClick={() => void discover()}>
              {t.discover}
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
              <button disabled={!sessionId || !buildId} onClick={() => void deviceAction("upload")}>
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
      <footer>
        <span className={dirty ? "dirty" : ""}>{dirty ? "● Unsaved changes" : "✓ Saved"}</span>
        <span>{status}</span>
        <span>{workspace?.manifest?.target ?? "ev3-native"}</span>
      </footer>
    </main>
  );
}
