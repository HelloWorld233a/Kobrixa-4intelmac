import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
export type Translate = (zh: string, en: string) => string;
export function Icon({
  name = "image",
}: {
  name?: "image" | "audio" | "upload" | "check" | "arrow" | "download";
}) {
  const paths = {
    image: "M4 4h16v16H4z M4 16l5-5 4 4 3-3 4 4 M14 8h.01",
    audio: "M4 10v4m4-8v12m4-15v18m4-15v12m4-8v4",
    upload: "M12 16V3m-5 5 5-5 5 5 M4 15v6h16v-6",
    check: "m5 12 4 4L19 6",
    arrow: "M4 12h16m-6-6 6 6-6 6",
    download: "M12 3v13m-5-5 5 5 5-5 M4 16v5h16v-5",
  };
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}
export function useBlobUrl(blob: Blob | undefined) {
  const [entry, setEntry] = useState<{ blob: Blob; url: string }>();
  useEffect(() => {
    if (!blob) {
      setEntry(undefined);
      return;
    }
    const url = URL.createObjectURL(blob);
    setEntry({ blob, url });
    return () => URL.revokeObjectURL(url);
  }, [blob]);
  return entry?.blob === blob ? entry?.url : undefined;
}
export function Range({
  label,
  value,
  min,
  max,
  step = 1,
  unit = "",
  onChange,
  hint,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (n: number) => void;
  hint?: string;
}) {
  const id = useId();
  return (
    <div className="studio-control">
      <div className="control-top">
        <label htmlFor={id}>{label}</label>
        <div className="number-unit">
          <input
            aria-label={label}
            type="number"
            min={min}
            max={max}
            step={step}
            value={Number.isFinite(value) ? value : ""}
            onChange={(e) => onChange(e.target.valueAsNumber)}
          />
          <span>{unit}</span>
        </div>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={Number.isFinite(value) ? value : min}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {hint && <p className="control-hint">{hint}</p>}
    </div>
  );
}
export function DropZone({
  kind,
  name,
  info,
  loading,
  active,
  onFile,
  onDemo,
  t,
}: {
  kind: "image" | "audio";
  name?: string | undefined;
  info?: string | undefined;
  loading: boolean;
  active: boolean;
  onFile: (file: File) => void;
  onDemo: () => void;
  t: Translate;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const upload = t("選擇檔案", "Choose file");
  return (
    <div
      className={`studio-drop ${drag ? "dragging" : ""} ${name ? "has-file" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setDrag(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        if (e.dataTransfer.files[0]) onFile(e.dataTransfer.files[0]);
      }}
    >
      <span className="drop-icon">
        <Icon name={name ? kind : "upload"} />
      </span>
      <div className="drop-copy">
        <strong>{name ?? t("把素材拖到這裡", "Drop your file here")}</strong>
        <p>
          {loading
            ? t("正在讀取…", "Reading file…")
            : (info ??
              (kind === "image"
                ? t("PNG、JPEG、WebP · 也可以直接貼上圖片", "PNG, JPEG, WebP · or paste an image")
                : t(
                    "WAV、MP3 等瀏覽器可解碼的音頻",
                    "WAV, MP3 and other browser-decodable audio",
                  )))}
        </p>
      </div>
      <div className="drop-actions">
        <button
          type="button"
          className="studio-button secondary"
          onClick={() => input.current?.click()}
        >
          {name ? t("替換檔案", "Replace file") : upload}
        </button>
        <button type="button" className="studio-text-button" onClick={onDemo}>
          {t("試用範例", "Try a demo")} <span aria-hidden="true">↗</span>
        </button>
      </div>
      <input
        ref={input}
        type="file"
        className="sr-only"
        aria-label={
          kind === "image" ? t("選擇圖片", "Choose image") : t("選擇音頻", "Choose audio")
        }
        tabIndex={active ? 0 : -1}
        accept={
          kind === "image"
            ? "image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
            : "audio/*,.wav,.mp3"
        }
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
export function PanelTitle({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="studio-panel-title">
      <h2>
        <span>{number}</span>
        {title}
      </h2>
      {children}
    </div>
  );
}
export function DownloadCard({
  bytes,
  name,
  setName,
  extension,
  t,
  pending = false,
}: {
  bytes?: Uint8Array<ArrayBuffer> | undefined;
  name: string;
  setName: (name: string) => void;
  extension: "rgf" | "rsf";
  t: Translate;
  pending?: boolean;
}) {
  const blob = useMemo(
    () => (bytes ? new Blob([bytes], { type: "application/octet-stream" }) : undefined),
    [bytes],
  );
  const url = useBlobUrl(blob);
  const [copyState, setCopyState] = useState("");
  const valid =
    name.trim().length > 0 &&
    name.trim() !== "." &&
    name.trim() !== ".." &&
    !/[\\/:*?"<>|]/.test(name) &&
    ![...name].some((c) => c.charCodeAt(0) < 32);
  const file = `${name.trim()}.${extension}`;
  const code =
    extension === "rgf"
      ? `LCD.BmpFile(1, 0, 0, "assets/deploy/${name.trim()}")\nLCD.Update()`
      : `Speaker.Play(35, "assets/deploy/${name.trim()}")\nSpeaker.Wait()`;
  useEffect(() => setCopyState(""), [code]);
  return (
    <div className="studio-download">
      <PanelTitle number="04" title={t("帶到你的 EV3", "Take it to your EV3")} />
      <div className="export-row">
        <label className="export-name">
          {t("檔案名稱", "File name")}
          <div>
            <input
              aria-label={t("檔案名稱", "File name")}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <span>.{extension}</span>
          </div>
        </label>
        <div className="export-action">
          <span className="export-size">
            {bytes
              ? `${bytes.length.toLocaleString()} bytes · ${extension.toUpperCase()}`
              : pending
                ? t("正在更新…", "Updating…")
                : t("選擇素材以開始", "Choose a file to begin")}
          </span>
          {url && valid && !pending ? (
            <a className="studio-button primary" href={url} download={file}>
              <Icon name="download" />
              {t("下載", "Download")} {extension.toUpperCase()}
            </a>
          ) : (
            <button className="studio-button primary" disabled>
              <Icon name="download" />
              {t("下載", "Download")} {extension.toUpperCase()}
            </button>
          )}
        </div>
      </div>
      {!valid && (
        <p className="studio-error" role="alert">
          {t(
            "請輸入不含斜線、引號或特殊路徑符號的檔名。",
            "Enter a file name without slashes, quotes or reserved path characters.",
          )}
        </p>
      )}
      <details className="usage-details">
        <summary>{t("如何在 Kobrixa 使用？", "How do I use this in Kobrixa?")}</summary>
        <p>
          {t(
            "將檔案放進專案的 assets/deploy 資料夾，並在 kobrixa.json 的 assets 加入 assets/deploy/**/*。上傳專案後使用以下程式：",
            "Put the file in your project's assets/deploy folder and include assets/deploy/**/* in kobrixa.json's assets list. Upload the project, then use:",
          )}
        </p>
        {valid && (
          <>
            <pre>
              <code>{code}</code>
            </pre>
            <button
              className="studio-text-button"
              onClick={() => {
                void Promise.resolve()
                  .then(() => navigator.clipboard.writeText(code))
                  .then(() => setCopyState(t("已複製", "Copied")))
                  .catch(() =>
                    setCopyState(t("請選取上方程式碼複製", "Select the code above to copy")),
                  );
              }}
            >
              {t("複製程式碼", "Copy code")}
            </button>
            <span role="status"> {copyState}</span>
          </>
        )}
      </details>
    </div>
  );
}
export function EmptyPreview({ kind, t }: { kind: "image" | "audio"; t: Translate }) {
  return (
    <div className="studio-empty">
      <div className={`empty-art ${kind}`}>
        <Icon name={kind} />
        <span />
        <span />
        <span />
      </div>
      <h3>{t("讓素材準備好登上 EV3", "A little file. A big idea.")}</h3>
      <p>
        {kind === "image"
          ? t(
              "匯入圖片，馬上比較原圖與黑白效果。",
              "Import an image to compare the original with its EV3 version.",
            )
          : t(
              "匯入音頻，在波形上選出你想保留的片段。",
              "Import audio and choose the part you want on the waveform.",
            )}
      </p>
    </div>
  );
}
