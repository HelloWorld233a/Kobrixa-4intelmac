import { useEffect, useMemo, useRef, useState } from "react";
import { convertImage, demoImage } from "./media-browser.js";
import { clamp, DEFAULT_IMAGE, imageGeometry } from "./media-processing.js";
import type { ImageSettings } from "./media-processing.js";
import { DownloadCard, DropZone, EmptyPreview, PanelTitle, Range } from "./tools-ui.js";
import type { Translate } from "./tools-ui.js";

export function ImageTool({ t, active }: { t: Translate; active: boolean }) {
  const [source, setSource] = useState<{
    image: HTMLImageElement;
    url: string;
    name: string;
    size: number;
  }>();
  const [settings, setSettings] = useState<ImageSettings>({ ...DEFAULT_IMAGE });
  const [name, setName] = useState("image");
  const [loading, setLoading] = useState(false),
    [error, setError] = useState(false);
  const [zoom, setZoom] = useState(2),
    [demoThreshold, setDemoThreshold] = useState(128);
  const version = useRef(0),
    urls = useRef(new Set<string>());
  const drag = useRef<{
    clientX: number;
    clientY: number;
    x: number;
    y: number;
    scale: number;
  } | null>(null);
  useEffect(() => {
    const owned = urls.current;
    return () => {
      version.current++;
      for (const url of owned) URL.revokeObjectURL(url);
      owned.clear();
    };
  }, []);
  const update = (patch: Partial<ImageSettings>) => setSettings((s) => ({ ...s, ...patch }));
  async function pick(file: File) {
    const id = ++version.current;
    setSource(undefined);
    setError(false);
    setLoading(true);
    for (const url of urls.current) URL.revokeObjectURL(url);
    urls.current.clear();
    const url = URL.createObjectURL(file);
    urls.current.add(url);
    try {
      if (!/^image\/(png|jpeg|webp)$/.test(file.type) && !/\.(png|jpe?g|webp)$/i.test(file.name))
        throw new Error();
      const image = new Image();
      image.src = url;
      await image.decode();
      if (id === version.current) {
        setSource({ image, url, name: file.name, size: file.size });
        setName(file.name.replace(/\.[^.]+$/, "") || "image");
        setSettings({ ...DEFAULT_IMAGE });
      }
    } catch {
      if (id === version.current) setError(true);
      URL.revokeObjectURL(url);
      urls.current.delete(url);
    } finally {
      if (id === version.current) setLoading(false);
    }
  }
  const pickRef = useRef(pick);
  pickRef.current = pick;
  useEffect(() => {
    if (!active) return;
    const paste = (event: ClipboardEvent) => {
      const target = event.target;
      if (target instanceof Element && target.closest('input,textarea,[contenteditable="true"]'))
        return;
      const item = Array.from(event.clipboardData?.items ?? []).find((item) =>
        item.type.startsWith("image/"),
      );
      const file = item?.getAsFile();
      if (file) {
        event.preventDefault();
        void pickRef.current(file);
      }
    };
    window.addEventListener("paste", paste);
    return () => window.removeEventListener("paste", paste);
  }, [active]);
  const result = useMemo(() => {
    if (!source) return undefined;
    try {
      return convertImage(source.image, settings);
    } catch {
      return undefined;
    }
  }, [source, settings]);
  const demo = () => {
    const id = ++version.current;
    setLoading(true);
    void demoImage()
      .then((file) => {
        if (id === version.current) return pick(file);
      })
      .catch(() => {
        if (id === version.current) {
          setLoading(false);
          setError(true);
        }
      });
  };
  const valid =
    Number.isInteger(settings.width) &&
    settings.width >= 1 &&
    settings.width <= 176 &&
    Number.isInteger(settings.height) &&
    settings.height >= 1 &&
    settings.height <= 128;
  return (
    <div className="studio-editor">
      <DropZone
        kind="image"
        name={source?.name}
        info={
          source
            ? `${source.image.naturalWidth} × ${source.image.naturalHeight} px · ${(source.size / 1024).toFixed(1)} KB`
            : undefined
        }
        loading={loading}
        active={active}
        onFile={(file) => void pick(file)}
        onDemo={demo}
        t={t}
      />
      <div className="studio-status" role="status">
        {loading
          ? t("正在解碼圖片…", "Decoding image…")
          : result
            ? t("預覽與 RGF 已同步", "Preview and RGF are in sync")
            : ""}
      </div>
      {error && (
        <p className="studio-error" role="alert">
          {t(
            "無法讀取圖片，請選擇有效的 PNG、JPEG 或 WebP。",
            "Cannot read this image. Choose a valid PNG, JPEG or WebP.",
          )}
        </p>
      )}
      <div className="studio-workspace">
        <aside className="studio-settings">
          <PanelTitle number="02" title={t("調整畫面", "Shape your image")}>
            <button
              className="studio-text-button"
              onClick={() => setSettings({ ...DEFAULT_IMAGE })}
            >
              {t("重設", "Reset")}
            </button>
          </PanelTitle>
          <fieldset className="studio-fieldset">
            <legend>{t("黑白風格", "Black & white style")}</legend>
            {(
              [
                [
                  "auto",
                  t("自動黑白", "Auto contrast"),
                  t("文字、圖示的好起點", "A good start for text and icons"),
                ],
                [
                  "manual",
                  t("手動黑白", "Manual threshold"),
                  t("自己決定哪些細節留下", "Choose which details stay"),
                ],
                [
                  "dither",
                  t("照片抖色", "Photo dither"),
                  t("用黑白點保留明暗層次", "Preserve shading with tiny dots"),
                ],
              ] as const
            ).map(([mode, title, hint]) => (
              <label
                className={`mode-option ${settings.mode === mode ? "selected" : ""}`}
                key={mode}
              >
                <input
                  type="radio"
                  name="image-mode"
                  value={mode}
                  checked={settings.mode === mode}
                  onChange={() => update({ mode })}
                />
                <span className={`mode-swatch ${mode}`} aria-hidden="true" />
                <span>
                  <strong>{title}</strong>
                  <small>{hint}</small>
                </span>
              </label>
            ))}
          </fieldset>
          {settings.mode === "manual" ? (
            <Range
              label={t("黑白閾值", "Threshold")}
              value={settings.threshold}
              min={0}
              max={255}
              onChange={(threshold) => update({ threshold })}
              hint={t(
                "調高 → 更多黑色；調低 → 更多白色。",
                "Higher → more black; lower → more white.",
              )}
            />
          ) : settings.mode === "auto" && result ? (
            <p className="auto-note">
              {t("自動選擇的閾值", "Auto-selected threshold")} <strong>{result.threshold}</strong>
            </p>
          ) : null}
          <details className="threshold-guide">
            <summary>{t("什麼是黑白閾值？", "What is a threshold?")}</summary>
            <p>
              {t(
                "每個像素都有 0（黑）到 255（白）的亮度。低於閾值變黑，其餘變白；提高閾值，就有更多區域變黑。",
                "Each pixel has a brightness from 0 (black) to 255 (white). Below the threshold becomes black; everything else becomes white. Raising it makes more of the image black.",
              )}
            </p>
            <Range
              label={t("試試看：示例閾值", "Try it: example threshold")}
              value={demoThreshold}
              min={0}
              max={255}
              onChange={setDemoThreshold}
            />
            <div
              className="gray-example"
              aria-label={t("灰階轉換示例", "Grayscale conversion example")}
            >
              <div className="gray-ramp" />
              <div
                className="binary-ramp"
                style={{
                  background: `linear-gradient(to right, #17212e ${(demoThreshold / 255) * 100}%, #fff ${(demoThreshold / 255) * 100}%)`,
                }}
              />
              <span>0</span>
              <span>255</span>
            </div>
            <p>
              {t("亮度 100 的像素現在變成：", "A pixel with brightness 100 now becomes: ")}
              <strong>{100 < demoThreshold ? t("黑色", "black") : t("白色", "white")}</strong>。
              {t(
                "例如閾值 128 時是黑色，80 時是白色。這個示例不會變更圖片設定。",
                "For example, it's black at 128 and white at 80. This demo does not change your image settings.",
              )}
            </p>
            {settings.invert && (
              <p>
                {t(
                  "已開啟反色：輸出時會再交換黑白。",
                  "Invert is on: black and white are swapped in the final output.",
                )}
              </p>
            )}
          </details>
          <fieldset className="studio-fieldset">
            <legend>{t("構圖方式", "Framing")}</legend>
            <div className="segmented">
              {(["contain", "cover"] as const).map((fit) => (
                <button
                  key={fit}
                  aria-pressed={settings.fit === fit}
                  onClick={() => update({ fit })}
                >
                  {fit === "contain"
                    ? t("完整保留", "Fit entire image")
                    : t("填滿裁切", "Fill & crop")}
                </button>
              ))}
            </div>
            <p className="control-hint">
              {settings.fit === "contain"
                ? t(
                    "等比例置中留白，透明背景轉白。",
                    "Keeps the whole image. Padding and transparency become white.",
                  )
                : t(
                    "拖曳左側原圖調整位置，也可聚焦後使用方向鍵。",
                    "Drag the source preview to reframe, or focus it and use arrow keys.",
                  )}
            </p>
          </fieldset>
          <label className="studio-check">
            <input
              type="checkbox"
              checked={settings.invert}
              onChange={(e) => update({ invert: e.target.checked })}
            />
            {t("反色（交換黑白）", "Invert black & white")}
          </label>
          <details className="studio-advanced">
            <summary>{t("進階調整", "Fine-tune")}</summary>
            <div className="size-controls">
              <label>
                {t("寬度", "Width")}
                <input
                  type="number"
                  min={1}
                  max={176}
                  value={Number.isFinite(settings.width) ? settings.width : ""}
                  onChange={(e) => update({ width: e.target.valueAsNumber })}
                />
              </label>
              <span>×</span>
              <label>
                {t("高度", "Height")}
                <input
                  type="number"
                  min={1}
                  max={128}
                  value={Number.isFinite(settings.height) ? settings.height : ""}
                  onChange={(e) => update({ height: e.target.valueAsNumber })}
                />
              </label>
            </div>
            <p className="control-hint">
              {t("EV3 畫面最大 176 × 128 像素。", "The EV3 display is 176 × 128 pixels.")}
            </p>
            <Range
              label={t("亮度", "Brightness")}
              value={settings.brightness}
              min={-100}
              max={100}
              onChange={(brightness) => update({ brightness })}
              hint={t("整體變亮或變暗。", "Lighten or darken the image.")}
            />
            <Range
              label={t("對比度", "Contrast")}
              value={settings.contrast}
              min={-100}
              max={100}
              onChange={(contrast) => update({ contrast })}
              hint={t(
                "增加或減少明暗差異。",
                "Increase or reduce separation between light and dark.",
              )}
            />
            {settings.fit === "cover" && (
              <>
                <Range
                  label={t("水平位置", "Horizontal position")}
                  value={settings.x}
                  min={0}
                  max={100}
                  onChange={(x) => update({ x })}
                />
                <Range
                  label={t("垂直位置", "Vertical position")}
                  value={settings.y}
                  min={0}
                  max={100}
                  onChange={(y) => update({ y })}
                />
              </>
            )}
          </details>
          {!valid && (
            <p className="studio-error" role="alert">
              {t(
                "寬度須為 1–176，高度須為 1–128 的整數。",
                "Width must be an integer from 1–176, height from 1–128.",
              )}
            </p>
          )}
          {source && valid && !result && (
            <p className="studio-error" role="alert">
              {t(
                "請檢查閾值、亮度、對比度與裁切位置。",
                "Check the threshold, brightness, contrast and crop position.",
              )}
            </p>
          )}
        </aside>
        <div className="studio-preview-column">
          <div className="studio-preview-panel">
            <PanelTitle number="03" title={t("看見每個像素", "See every pixel")} />
            <div className="preview-toolbar">
              <span>{t("原圖與輸出對照", "Source / output comparison")}</span>
              <div className="segmented compact" aria-label={t("預覽倍率", "Preview scale")}>
                {[1, 2, 3].map((scale) => (
                  <button key={scale} aria-pressed={zoom === scale} onClick={() => setZoom(scale)}>
                    {scale}×
                  </button>
                ))}
              </div>
            </div>
            {source && result ? (
              <>
                <div className="image-compare">
                  <figure>
                    <figcaption>
                      <span className="status-dot neutral" />
                      {t("原圖構圖", "Source framing")}
                    </figcaption>
                    <div className="image-scroll">
                      <img
                        className={`source-frame ${settings.fit === "cover" ? "draggable" : ""}`}
                        style={{ width: settings.width * zoom, height: settings.height * zoom }}
                        src={result.original}
                        alt={t("原圖構圖預覽", "Source framing preview")}
                        tabIndex={settings.fit === "cover" ? 0 : undefined}
                        draggable={false}
                        onKeyDown={(e) => {
                          if (settings.fit !== "cover" || !e.key.startsWith("Arrow")) return;
                          e.preventDefault();
                          update({
                            x: clamp(
                              settings.x +
                                (e.key === "ArrowRight" ? 2 : e.key === "ArrowLeft" ? -2 : 0),
                              0,
                              100,
                            ),
                            y: clamp(
                              settings.y +
                                (e.key === "ArrowDown" ? 2 : e.key === "ArrowUp" ? -2 : 0),
                              0,
                              100,
                            ),
                          });
                        }}
                        onPointerDown={(e) => {
                          if (settings.fit !== "cover") return;
                          e.currentTarget.setPointerCapture(e.pointerId);
                          drag.current = {
                            clientX: e.clientX,
                            clientY: e.clientY,
                            x: settings.x,
                            y: settings.y,
                            scale: zoom,
                          };
                        }}
                        onPointerMove={(e) => {
                          if (!drag.current || settings.fit !== "cover") return;
                          const r = imageGeometry(
                              source.image.naturalWidth,
                              source.image.naturalHeight,
                              settings,
                            ),
                            d = drag.current;
                          update({
                            x:
                              r.width > settings.width
                                ? clamp(
                                    d.x -
                                      ((e.clientX - d.clientX) /
                                        ((r.width - settings.width) * d.scale)) *
                                        100,
                                    0,
                                    100,
                                  )
                                : 50,
                            y:
                              r.height > settings.height
                                ? clamp(
                                    d.y -
                                      ((e.clientY - d.clientY) /
                                        ((r.height - settings.height) * d.scale)) *
                                        100,
                                    0,
                                    100,
                                  )
                                : 50,
                          });
                        }}
                        onPointerUp={() => {
                          drag.current = null;
                        }}
                        onPointerCancel={() => {
                          drag.current = null;
                        }}
                      />
                    </div>
                  </figure>
                  <figure>
                    <figcaption>
                      <span className="status-dot" />
                      {t("EV3 輸出", "EV3 output")}
                      <span className="tiny-badge">1-BIT</span>
                    </figcaption>
                    <div className="image-scroll">
                      <div className="ev3-frame">
                        <img
                          className="pixel-output"
                          src={result.preview}
                          style={{ width: settings.width * zoom, height: settings.height * zoom }}
                          alt={t("實際 RGF 黑白像素", "Actual RGF black and white pixels")}
                        />
                      </div>
                    </div>
                  </figure>
                </div>
                <div className="preview-meta">
                  <span>
                    {settings.width} × {settings.height} px
                  </span>
                  <span>{t("與下載檔完全一致", "Matches the downloaded file")}</span>
                </div>
              </>
            ) : (
              <EmptyPreview kind="image" t={t} />
            )}
          </div>
          <DownloadCard
            bytes={result?.bytes}
            name={name}
            setName={setName}
            extension="rgf"
            t={t}
            pending={loading}
          />
        </div>
      </div>
    </div>
  );
}
