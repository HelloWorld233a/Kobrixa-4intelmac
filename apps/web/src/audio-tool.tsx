import { useEffect, useMemo, useRef, useState } from "react";
import { convertAudio, demoAudio } from "./media-browser.js";
import { MAX_DURATION, MAX_SAMPLES, sampleCount, SAMPLE_RATE } from "./media.js";
import { clamp, DEFAULT_AUDIO, waveformPeaks } from "./media-processing.js";
import type { AudioSettings } from "./media-processing.js";
import { DownloadCard, DropZone, EmptyPreview, PanelTitle, Range } from "./tools-ui.js";
import type { Translate } from "./tools-ui.js";

type Source = { buffer: AudioBuffer; name: string; size: number; peaks: Float32Array };
function Waveform({
  source,
  settings,
  cursor,
  update,
  t,
}: {
  source: Source;
  settings: AudioSettings;
  cursor: number;
  update: (patch: Partial<AudioSettings>) => void;
  t: Translate;
}) {
  const { duration } = source.buffer;
  const view = useRef<HTMLDivElement>(null);
  const safeStart = clamp(Number.isFinite(settings.start) ? settings.start : 0, 0, duration);
  const safeEnd = clamp(Number.isFinite(settings.end) ? settings.end : duration, 0, duration);
  const from = clamp(
      Number.isFinite(settings.start) ? (settings.start / duration) * 100 : 0,
      0,
      100,
    ),
    to = clamp(Number.isFinite(settings.end) ? (settings.end / duration) * 100 : 100, 0, 100);
  const step = Math.min(0.01, duration / 100),
    minimum = 1 / SAMPLE_RATE;
  const path = useMemo(
    () =>
      Array.from(
        source.peaks,
        (peak, i) =>
          `M${((i + 0.5) / source.peaks.length) * 1000},${80 - Math.max(1, peak * 65)}v${Math.max(2, peak * 130)}`,
      ).join(" "),
    [source.peaks],
  );
  function move(key: "start" | "end", clientX: number) {
    const rect = view.current!.getBoundingClientRect();
    const time = clamp(((clientX - rect.left) / rect.width) * duration, 0, duration);
    update(
      key === "start"
        ? { start: clamp(Math.round(time * 1e6) / 1e6, 0, Math.max(0, safeEnd - minimum)) }
        : {
            end: clamp(
              Math.round(time * 1e6) / 1e6,
              Math.min(duration, safeStart + minimum),
              duration,
            ),
          },
    );
  }
  return (
    <>
      <div className="waveform" ref={view}>
        <svg viewBox="0 0 1000 160" preserveAspectRatio="none" aria-hidden="true">
          <path d={path} fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        <div className="wave-dim left" style={{ width: `${from}%` }} />
        <div className="wave-dim right" style={{ width: `${100 - to}%` }} />
        <div
          className="wave-selection"
          style={{ left: `${from}%`, width: `${Math.max(0, to - from)}%` }}
        />
        {(["start", "end"] as const).map((key) => (
          <div
            key={key}
            className={`wave-handle ${key}`}
            style={{ left: `${key === "start" ? from : to}%` }}
            tabIndex={0}
            role="slider"
            aria-label={
              key === "start"
                ? t("波形開始位置", "Waveform start")
                : t("波形結束位置", "Waveform end")
            }
            aria-valuemin={key === "start" ? 0 : Math.min(safeStart + minimum, duration)}
            aria-valuemax={key === "start" ? Math.max(0, safeEnd - minimum) : duration}
            aria-valuenow={Number.isFinite(settings[key]) ? settings[key] : 0}
            aria-valuetext={`${Number.isFinite(settings[key]) ? settings[key].toFixed(3) : 0} ${t("秒", "seconds")}`}
            onPointerDown={(e) => {
              e.preventDefault();
              e.currentTarget.focus();
              e.currentTarget.setPointerCapture(e.pointerId);
            }}
            onPointerMove={(e) => {
              if (e.currentTarget.hasPointerCapture(e.pointerId)) move(key, e.clientX);
            }}
            onPointerUp={(e) => {
              if (e.currentTarget.hasPointerCapture(e.pointerId))
                e.currentTarget.releasePointerCapture(e.pointerId);
            }}
            onKeyDown={(e) => {
              let v = key === "start" ? safeStart : safeEnd;
              if (e.key === "ArrowLeft" || e.key === "ArrowDown") v -= step * (e.shiftKey ? 10 : 1);
              else if (e.key === "ArrowRight" || e.key === "ArrowUp")
                v += step * (e.shiftKey ? 10 : 1);
              else if (e.key === "Home") v = 0;
              else if (e.key === "End") v = duration;
              else return;
              e.preventDefault();
              update(
                key === "start"
                  ? {
                      start: clamp(Math.round(v * 1e6) / 1e6, 0, Math.max(0, safeEnd - minimum)),
                    }
                  : {
                      end: clamp(
                        Math.round(v * 1e6) / 1e6,
                        Math.min(duration, safeStart + minimum),
                        duration,
                      ),
                    },
              );
            }}
          >
            <span aria-hidden="true">Ⅱ</span>
          </div>
        ))}
        {cursor >= 0 && (
          <div
            className="wave-cursor"
            style={{ left: `${clamp((cursor / duration) * 100, 0, 100)}%` }}
          />
        )}
      </div>
      <div className="wave-ticks">
        {[0, 0.25, 0.5, 0.75, 1].map((f) => (
          <span key={f}>{(f * duration).toFixed(1)}s</span>
        ))}
      </div>
      <p className="control-hint">
        {t(
          "拖曳兩端把手選取片段。方向鍵微調，Shift + 方向鍵加速。",
          "Drag either handle to trim. Arrow keys fine-tune; Shift + arrows move faster.",
        )}
      </p>
    </>
  );
}

export function AudioTool({ t, active }: { t: Translate; active: boolean }) {
  const [source, setSource] = useState<Source>();
  const [settings, setSettings] = useState<AudioSettings>({ ...DEFAULT_AUDIO });
  const [name, setName] = useState("sound");
  const [loading, setLoading] = useState(false),
    [loadError, setLoadError] = useState(false),
    [convertError, setConvertError] = useState(false),
    [playError, setPlayError] = useState(false);
  const [result, setResult] = useState<{
    source: Source;
    settings: AudioSettings;
    bytes: Uint8Array<ArrayBuffer>;
    clipped: number;
  }>();
  const [playing, setPlaying] = useState<"original" | "output" | null>(null),
    [cursor, setCursor] = useState(-1);
  const loadVersion = useRef(0),
    conversionVersion = useRef(0),
    playVersion = useRef(0),
    contexts = useRef(new Set<AudioContext>());
  const playback = useRef<{
    context: AudioContext;
    node: AudioBufferSourceNode;
    frame: number;
  } | null>(null);
  function stop() {
    playVersion.current++;
    const p = playback.current;
    playback.current = null;
    if (p) {
      cancelAnimationFrame(p.frame);
      p.node.onended = null;
      try {
        p.node.stop();
      } catch {
        /* Already stopped. */
      }
      p.node.disconnect();
      void p.context.close().catch(() => {});
    }
    setPlaying(null);
    setCursor(-1);
  }
  const stopRef = useRef(stop);
  stopRef.current = stop;
  useEffect(() => {
    if (!active) stopRef.current();
  }, [active]);
  useEffect(() => {
    const owned = contexts.current;
    return () => {
      loadVersion.current++;
      conversionVersion.current++;
      stopRef.current();
      for (const c of owned) void c.close().catch(() => {});
      owned.clear();
    };
  }, []);
  function update(patch: Partial<AudioSettings>) {
    stop();
    setConvertError(false);
    setSettings((s) => ({ ...s, ...patch }));
  }
  async function pick(file: File) {
    stop();
    const id = ++loadVersion.current;
    conversionVersion.current++;
    setSource(undefined);
    setResult(undefined);
    setLoading(true);
    setLoadError(false);
    setConvertError(false);
    setPlayError(false);
    for (const c of contexts.current) void c.close().catch(() => {});
    contexts.current.clear();
    let context: AudioContext | undefined;
    try {
      context = new AudioContext();
      contexts.current.add(context);
      const buffer = await context.decodeAudioData(await file.arrayBuffer());
      if (id === loadVersion.current) {
        const channels = Array.from({ length: buffer.numberOfChannels }, (_, i) =>
          buffer.getChannelData(i),
        );
        const peaks = waveformPeaks(channels);
        setSource({ buffer, name: file.name, size: file.size, peaks });
        setSettings({ ...DEFAULT_AUDIO, end: buffer.duration });
        setName(file.name.replace(/\.[^.]+$/, "") || "sound");
      }
    } catch {
      if (id === loadVersion.current) setLoadError(true);
    } finally {
      if (context) {
        contexts.current.delete(context);
        if (context.state !== "closed") await context.close().catch(() => {});
      }
      if (id === loadVersion.current) setLoading(false);
    }
  }
  let count = 0;
  try {
    if (source) count = sampleCount(settings.start, settings.end, source.buffer.duration);
  } catch {
    /* Range guidance below. */
  }
  const effectsValid =
    [settings.volume, settings.fadeIn, settings.fadeOut].every(Number.isFinite) &&
    settings.volume >= 0 &&
    settings.volume <= 200 &&
    settings.fadeIn >= 0 &&
    settings.fadeOut >= 0 &&
    settings.fadeIn <= settings.end - settings.start &&
    settings.fadeOut <= settings.end - settings.start;
  const valid = count > 0 && effectsValid;
  const current = result?.source === source && result?.settings === settings ? result : undefined;
  useEffect(() => {
    const id = ++conversionVersion.current;
    if (!source || !valid || !active) return;
    const debounce = window.setTimeout(() => {
      void convertAudio(source.buffer, settings)
        .then((converted) => {
          if (id === conversionVersion.current) setResult({ source, settings, ...converted });
        })
        .catch(() => {
          if (id === conversionVersion.current) setConvertError(true);
        });
    }, 250);
    return () => {
      window.clearTimeout(debounce);
      conversionVersion.current++;
    };
  }, [source, settings, valid, active]);
  async function play(kind: "original" | "output") {
    if (playing === kind) {
      stop();
      return;
    }
    stop();
    setPlayError(false);
    if (!source || !count || (kind === "output" && !current)) return;
    const id = playVersion.current;
    let context: AudioContext | undefined;
    try {
      context = new AudioContext();
      const node = context.createBufferSource();
      if (kind === "original") node.buffer = source.buffer;
      else {
        const bytes = current!.bytes;
        const buffer = context.createBuffer(1, bytes.length - 8, SAMPLE_RATE);
        const channel = buffer.getChannelData(0);
        for (let i = 0; i < channel.length; i++) channel[i] = (bytes[8 + i]! - 128) / 128;
        node.buffer = buffer;
      }
      node.connect(context.destination);
      const p = { context, node, frame: 0 };
      playback.current = p;
      await context.resume();
      if (id !== playVersion.current) {
        if (context.state !== "closed") void context.close().catch(() => {});
        return;
      }
      const started = context.currentTime;
      node.onended = () => {
        if (playback.current === p) stopRef.current();
      };
      node.start(
        0,
        kind === "original" ? settings.start : 0,
        kind === "original" ? settings.end - settings.start : undefined,
      );
      setPlaying(kind);
      const tick = () => {
        if (playback.current !== p) return;
        setCursor(Math.min(settings.end, settings.start + context!.currentTime - started));
        p.frame = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      if (context && context.state !== "closed") void context.close().catch(() => {});
      if (id === playVersion.current) {
        stop();
        setPlayError(true);
      }
    }
  }
  const selected = Number.isFinite(settings.end - settings.start)
    ? Math.max(0, settings.end - settings.start)
    : 0;
  return (
    <div className="studio-editor">
      <DropZone
        kind="audio"
        name={source?.name}
        info={
          source
            ? `${source.buffer.duration.toFixed(2)}s · ${t("解碼後", "Decoded")} ${(source.buffer.sampleRate / 1000).toFixed(1)} kHz · ${source.buffer.numberOfChannels} ch · ${(source.size / 1024).toFixed(1)} KB`
            : undefined
        }
        loading={loading}
        active={active}
        onFile={(file) => void pick(file)}
        onDemo={() => void pick(demoAudio())}
        t={t}
      />
      <div className="studio-status" role="status">
        {loading
          ? t("正在解碼音頻…", "Decoding audio…")
          : current
            ? t("試聽與 RSF 已同步", "Preview and RSF are in sync")
            : source && valid && !convertError
              ? t("正在更新音頻…", "Updating audio…")
              : ""}
      </div>
      {loadError && (
        <p className="studio-error" role="alert">
          {t(
            "無法解碼音頻，請嘗試有效的 WAV 或 MP3。",
            "Cannot decode this audio. Try a valid WAV or MP3.",
          )}
        </p>
      )}
      <div className="studio-workspace audio-workspace">
        <aside className="studio-settings">
          <PanelTitle number="02" title={t("留下最好的片段", "Keep the best part")}>
            <button
              className="studio-text-button"
              onClick={() => {
                stop();
                setSettings({ ...DEFAULT_AUDIO, end: source?.buffer.duration ?? 0 });
                setConvertError(false);
              }}
            >
              {t("重設", "Reset")}
            </button>
          </PanelTitle>
          <fieldset disabled={!source} className="studio-fieldset">
            <legend>{t("裁切範圍", "Trim range")}</legend>
            <div className="time-inputs">
              {(["start", "end"] as const).map((key) => (
                <label key={key}>
                  {key === "start"
                    ? t("開始（秒）", "Start (seconds)")
                    : t("結束（秒）", "End (seconds)")}
                  <input
                    type="number"
                    min={0}
                    max={source?.buffer.duration ?? 0}
                    step="any"
                    value={Number.isFinite(settings[key]) ? settings[key] : ""}
                    onChange={(e) => update({ [key]: e.target.valueAsNumber })}
                  />
                </label>
              ))}
            </div>
            <p className="control-hint">
              {t(
                "輸入精確時間，或直接拖曳右側波形。",
                "Enter an exact time, or drag the waveform handles.",
              )}
            </p>
            {source && source.buffer.duration > MAX_DURATION && (
              <button
                className="studio-button secondary full-width"
                onClick={() => update({ start: 0, end: MAX_DURATION })}
              >
                {t("選取前 8.19 秒", "Select first 8.19 seconds")}
              </button>
            )}
            <Range
              label={t("音量", "Volume")}
              min={0}
              max={200}
              value={settings.volume}
              unit="%"
              onChange={(volume) => update({ volume })}
              hint={t(
                "100% 保留原始音量；超過會放大。",
                "100% keeps the original level; higher values amplify it.",
              )}
            />
            <details className="studio-advanced">
              <summary>{t("聲音修飾", "Sound finishing")}</summary>
              <label className="studio-check">
                <input
                  type="checkbox"
                  checked={settings.normalize}
                  onChange={(e) => update({ normalize: e.target.checked })}
                />
                {t("峰值正規化至 −1 dBFS", "Normalize peak to −1 dBFS")}
              </label>
              <p className="control-hint">
                {t(
                  "先調整峰值，再套用音量與淡入淡出。靜音保持靜音。",
                  "Adjusts the peak before volume and fades. Silence stays silent.",
                )}
              </p>
              <Range
                label={t("淡入", "Fade in")}
                min={0}
                max={selected}
                step={0.01}
                value={settings.fadeIn}
                unit="s"
                onChange={(fadeIn) => update({ fadeIn })}
                hint={t("讓片段開頭平順進入。", "Soften the beginning of the clip.")}
              />
              <Range
                label={t("淡出", "Fade out")}
                min={0}
                max={selected}
                step={0.01}
                value={settings.fadeOut}
                unit="s"
                onChange={(fadeOut) => update({ fadeOut })}
                hint={t("讓片段結尾平順收尾。", "Soften the end of the clip.")}
              />
            </details>
          </fieldset>
          {source && !count && (
            <p className="studio-error" role="alert">
              {t(
                "請選擇有效範圍：長度須大於零，且不超過 8.191875 秒。",
                "Choose a valid range longer than zero and no longer than 8.191875 seconds.",
              )}
            </p>
          )}
          {source && count > 0 && !effectsValid && (
            <p className="studio-error" role="alert">
              {t(
                "請檢查音量；淡入／淡出不能超過片段長度。",
                "Check the volume; fades cannot exceed the clip length.",
              )}
            </p>
          )}
          {convertError && (
            <p className="studio-error" role="alert">
              {t(
                "轉換失敗，請調整設定或重新匯入音頻。",
                "Conversion failed. Adjust the settings or import the audio again.",
              )}
            </p>
          )}
          {Boolean(current?.clipped) && (
            <p className="studio-warning" role="status">
              {t(
                "放大後部分樣本已削波，可能產生失真。請降低音量。",
                "Some amplified samples are clipped and may sound distorted. Reduce the volume.",
              )}
            </p>
          )}
          <div className="format-note">
            <span>EV3 / RSF</span>
            <p>8 kHz · {t("單聲道", "Mono")} · 8-bit PCM</p>
            <small>
              {t("最多 65,535 樣本，約 8.19 秒。", "Up to 65,535 samples, about 8.19 seconds.")}
            </small>
          </div>
        </aside>
        <div className="studio-preview-column">
          <div className="studio-preview-panel">
            <PanelTitle number="03" title={t("看見聲音的形狀", "See the shape of sound")} />
            {source ? (
              <>
                <div className="wave-summary">
                  <div>
                    <span>{t("選取長度", "Selected duration")}</span>
                    <strong>
                      {selected.toFixed(3)}
                      <small> s</small>
                    </strong>
                  </div>
                  <span className={`tiny-badge ${!count ? "warning" : ""}`}>
                    {count
                      ? `${count.toLocaleString()} / ${MAX_SAMPLES.toLocaleString()}`
                      : t("請調整範圍", "Adjust the range")}
                  </span>
                </div>
                <Waveform
                  source={source}
                  settings={settings}
                  cursor={cursor}
                  update={update}
                  t={t}
                />
                <div className="capacity-track">
                  <span
                    style={{ width: `${Math.min(100, (selected / MAX_DURATION) * 100)}%` }}
                    className={!count ? "over" : ""}
                  />
                </div>
                <div className="preview-meta">
                  <span>
                    {count
                      ? `${count + 8} bytes`
                      : t("超出範圍或選取無效", "Out of range or invalid selection")}
                  </span>
                  <span>{t("RSF 容量", "RSF capacity")}</span>
                </div>
                <div className="audio-transport">
                  <button
                    className={`studio-button ${playing === "original" ? "primary" : "secondary"}`}
                    disabled={!count}
                    onClick={() => void play("original")}
                  >
                    <span aria-hidden="true">{playing === "original" ? "■" : "▶"}</span>
                    {t("原音選段", "Original selection")}
                  </button>
                  <button
                    className={`studio-button ${playing === "output" ? "primary" : "secondary"}`}
                    disabled={!current || !valid}
                    onClick={() => void play("output")}
                  >
                    <span aria-hidden="true">{playing === "output" ? "■" : "▶"}</span>
                    {t("EV3 輸出試聽", "EV3 output preview")}
                  </button>
                </div>
                <p className="control-hint">
                  {t(
                    "輸出試聽使用下載檔的實際量化音訊；實體喇叭的音色可能不同。",
                    "Output preview uses the exact quantized samples in the download. The physical speaker may sound different.",
                  )}
                </p>
                {playError && (
                  <p className="studio-error" role="alert">
                    {t(
                      "無法啟動播放，請再按一次試聽。",
                      "Playback could not start. Try the preview button again.",
                    )}
                  </p>
                )}
              </>
            ) : (
              <EmptyPreview kind="audio" t={t} />
            )}
          </div>
          <DownloadCard
            bytes={valid ? current?.bytes : undefined}
            name={name}
            setName={setName}
            extension="rsf"
            t={t}
            pending={loading || Boolean(source && valid && !current && !convertError)}
          />
        </div>
      </div>
    </div>
  );
}
