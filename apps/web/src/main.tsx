import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { DocsPage } from "./docs.js";
import "./styles.css";

type Locale = "zh-TW" | "en";

const github = "https://github.com/Kingsley1116/Kobrixa";

const copy = {
  "zh-TW": {
    localeName: "English",
    nav: { features: "功能", learn: "學習資源", download: "下載", docs: "文件", github: "GitHub" },
    hero: {
      label: "為 EV3 而生的程式環境",
      title: "用程式，讓創意真的動起來。",
      body: "Kobrixa 讓學生、創客與教學者，從第一行 Basic Plus 程式一路走到 EV3 機器人的實際動作。",
      learn: "開始學習",
      source: "查看原始碼",
      note: "離線優先 · 開源開發中",
    },
    proof: ["從 .bp 原始碼開始", "在本機建置 .rbf", "USB 或 Wi-Fi 連接"],
    features: {
      eyebrow: "為清楚的實作流程設計",
      title: "少一點猜測，多一點實際回饋。",
      cards: [
        [
          "離線也能專心做",
          "編輯與建置都在你的電腦上完成；網路只在你選擇以 Wi-Fi 連接 EV3 時才需要。",
        ],
        [
          "讀得懂的診斷",
          "從語法到裝置連線，Kobrixa 將問題標示在該看的位置，並保留可採取行動的細節。",
        ],
        ["為實體機器人而建", "將支援的 Basic Plus 程式編譯為原生 EV3 .rbf，然後上傳、執行、停止。"],
      ],
    },
    flow: {
      eyebrow: "一條能看見終點的路",
      title: "從想法到機器人的四個步驟。",
      steps: [
        ["01", "寫下程式", "以熟悉的 Basic Plus 開始，專心描述機器人該做什麼。"],
        ["02", "在本機建置", "Kobrixa 會檢查程式並產生可部署的 EV3 成品。"],
        ["03", "連接你的 EV3", "透過 USB 搜尋，或輸入受信任網路中的 Wi-Fi 位址。"],
        ["04", "上傳並觀察", "把程式送上主機，執行、停止，再調整下一個想法。"],
      ],
    },
    learn: {
      eyebrow: "從一個小專案開始",
      title: "學習時，手邊就有能跑的範例。",
      body: "依照學習路徑，從顯示、按鈕、感測器到完整的機器人挑戰。每個範例都附帶可閱讀的原始碼。",
      path: "查看學習路徑",
      examples: "瀏覽全部範例",
      cards: ["顯示與按鈕", "感測器", "聲音與動作"],
    },
    download: {
      eyebrow: "桌面版正在準備",
      title: "Kobrixa v1 candidate 即將推出。",
      body: "Windows、macOS 與 Linux 的正式安裝檔尚在完成實機驗證。現在可以先從原始碼建置，或閱讀安裝說明。",
      soon: "即將推出",
      install: "閱讀安裝說明",
      status: "候選版 · 三平台硬體驗證中",
    },
    footer: {
      description: "一個獨立、開源的 EV3 程式開發環境。",
      docs: "文件",
      license: "Apache License 2.0",
      trademark:
        "LEGO、MINDSTORMS 與 EV3 是 LEGO Group 的商標。Kobrixa 與 LEGO Group 無隸屬、認可或贊助關係。",
    },
  },
  en: {
    localeName: "繁中",
    nav: {
      features: "Features",
      learn: "Learn",
      download: "Download",
      docs: "Docs",
      github: "GitHub",
    },
    hero: {
      label: "A programming environment for EV3",
      title: "Make ideas move with code.",
      body: "Kobrixa helps students, makers, and educators take a Basic Plus program from its first line to a real EV3 robot in motion.",
      learn: "Start learning",
      source: "View source",
      note: "Offline-first · Open-source in development",
    },
    proof: ["Start with .bp source", "Build .rbf locally", "Connect over USB or Wi-Fi"],
    features: {
      eyebrow: "Built for a clear path from code to robot",
      title: "Less guessing. More useful feedback.",
      cards: [
        [
          "Stay focused offline",
          "Editing and builds happen on your computer. A network is only needed when you choose to connect to an EV3 over Wi-Fi.",
        ],
        [
          "Diagnostics that make sense",
          "From syntax to device connections, Kobrixa puts issues where you need them and keeps the details actionable.",
        ],
        [
          "Made for physical robots",
          "Compile supported Basic Plus programs to native EV3 .rbf files, then upload, run, and stop them.",
        ],
      ],
    },
    flow: {
      eyebrow: "A path with a visible finish line",
      title: "Four steps from an idea to a robot.",
      steps: [
        [
          "01",
          "Write the program",
          "Start with familiar Basic Plus and describe what your robot should do.",
        ],
        [
          "02",
          "Build locally",
          "Kobrixa checks your program and produces an EV3 artifact ready to deploy.",
        ],
        [
          "03",
          "Connect your EV3",
          "Search over USB or enter a Wi-Fi address on a trusted network.",
        ],
        [
          "04",
          "Upload and observe",
          "Send the program to the brick, run it, stop it, and refine the next idea.",
        ],
      ],
    },
    learn: {
      eyebrow: "Begin with a small project",
      title: "Examples you can run while you learn.",
      body: "Follow a learning path from displays, buttons, and sensors to complete robot challenges. Every example includes source you can read.",
      path: "View learning path",
      examples: "Browse all examples",
      cards: ["Displays & buttons", "Sensors", "Sound & motion"],
    },
    download: {
      eyebrow: "The desktop app is on its way",
      title: "Kobrixa v1 candidate is coming soon.",
      body: "Windows, macOS, and Linux installers are still completing hardware validation. You can build from source now or read the installation guide.",
      soon: "Coming soon",
      install: "Read installation guide",
      status: "Candidate · hardware validation in progress",
    },
    footer: {
      description: "An independent, open-source programming environment for EV3.",
      docs: "Documentation",
      license: "Apache License 2.0",
      trademark:
        "LEGO, MINDSTORMS, and EV3 are trademarks of the LEGO Group. Kobrixa is not affiliated with, endorsed by, or sponsored by the LEGO Group.",
    },
  },
} as const;

function CodeWorkbench() {
  return (
    <div className="workbench" aria-label="Kobrixa code editor preview">
      <div className="workbench-bar">
        <span className="dot orange" />
        <span className="dot yellow" />
        <span className="dot blue" />
        <span>obstacle-rover.bp</span>
      </div>
      <div className="workbench-body">
        <div className="code-lines" aria-hidden="true">
          <span>1</span>
          <span>2</span>
          <span>3</span>
          <span>4</span>
          <span>5</span>
          <span>6</span>
          <span>7</span>
        </div>
        <pre>
          <code>
            <em>sub</em> Main()
            <br />
            &nbsp;&nbsp;Motor.Start(<strong>OUT_BC</strong>, <b>45</b>)<br />
            &nbsp;&nbsp;<em>while</em> Sensor.Read(<strong>IN_1</strong>) &gt; <b>20</b>
            <br />
            &nbsp;&nbsp;&nbsp;&nbsp;Wait(<b>20</b>)<br />
            &nbsp;&nbsp;<em>endwhile</em>
            <br />
            &nbsp;&nbsp;Motor.Stop(<strong>OUT_BC</strong>)<br />
            <em>ends</em>
          </code>
        </pre>
      </div>
      <div className="workbench-status">
        <span>✓ Build complete</span>
        <span>EV3 connected</span>
      </div>
    </div>
  );
}

function HomePage({ locale, toggleLocale }: { locale: Locale; toggleLocale: () => void }) {
  const t = copy[locale];
  const learnPath = `${github}/blob/main/examples/LEARNING-PATH.md`;
  const installation = `${github}/blob/main/docs/${locale === "zh-TW" ? "zh-TW" : "en"}/installation.md`;

  return (
    <>
      <a className="skip-link" href="#content">
        Skip to content
      </a>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Kobrixa home">
          <span className="brand-mark">K</span>
          <span>Kobrixa</span>
        </a>
        <nav aria-label="Primary navigation">
          <a href="#features">{t.nav.features}</a>
          <a href="/docs">{t.nav.learn}</a>
          <a href="#download">{t.nav.download}</a>
          <a href="/docs">{t.nav.docs}</a>
        </nav>
        <div className="header-actions">
          <button
            className="language"
            onClick={toggleLocale}
            aria-label={`Switch language to ${t.localeName}`}
          >
            {t.localeName}
          </button>
          <a className="github-link" href={github} target="_blank" rel="noreferrer">
            {t.nav.github} <span aria-hidden="true">↗</span>
          </a>
        </div>
      </header>

      <main id="content">
        <section className="hero" id="top">
          <div className="hero-copy">
            <p className="eyebrow">
              <span className="eyebrow-marker" />
              {t.hero.label}
            </p>
            <h1>{t.hero.title}</h1>
            <p className="hero-body">{t.hero.body}</p>
            <div className="hero-actions">
              <a className="button primary" href="/docs">
                {t.hero.learn} <span aria-hidden="true">→</span>
              </a>
              <a className="button secondary" href={github} target="_blank" rel="noreferrer">
                {t.hero.source} <span aria-hidden="true">↗</span>
              </a>
            </div>
            <p className="hero-note">{t.hero.note}</p>
          </div>
          <div className="hero-visual">
            <div className="tape">BASIC PLUS</div>
            <CodeWorkbench />
            <div className="brick">
              <div className="brick-screen">
                <span>EV3</span>
                <i>●</i>
              </div>
              <div className="brick-controls">
                <b>◁</b>
                <b>△</b>
                <b>▷</b>
              </div>
              <div className="brick-ports">
                <span />
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>
        </section>

        <section className="proof" aria-label="Kobrixa workflow summary">
          {t.proof.map((item, index) => (
            <div key={item}>
              <span>0{index + 1}</span>
              <p>{item}</p>
            </div>
          ))}
        </section>

        <section className="section feature-section" id="features">
          <p className="eyebrow">
            <span className="eyebrow-marker" />
            {t.features.eyebrow}
          </p>
          <h2>{t.features.title}</h2>
          <div className="feature-grid">
            {t.features.cards.map(([title, body], index) => (
              <article className="feature-card" key={title}>
                <span className={`feature-number feature-${index + 1}`}>0{index + 1}</span>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section flow-section">
          <div className="section-intro">
            <p className="eyebrow">
              <span className="eyebrow-marker" />
              {t.flow.eyebrow}
            </p>
            <h2>{t.flow.title}</h2>
          </div>
          <ol className="flow-list">
            {t.flow.steps.map(([number, title, body]) => (
              <li key={number}>
                <span>{number}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="learn-section" id="learn">
          <div className="learn-copy">
            <p className="eyebrow">
              <span className="eyebrow-marker" />
              {t.learn.eyebrow}
            </p>
            <h2>{t.learn.title}</h2>
            <p>{t.learn.body}</p>
            <div className="learn-actions">
              <a className="button primary" href={learnPath} target="_blank" rel="noreferrer">
                {t.learn.path} <span aria-hidden="true">↗</span>
              </a>
              <a
                className="text-link"
                href={`${github}/tree/main/examples`}
                target="_blank"
                rel="noreferrer"
              >
                {t.learn.examples} <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>
          <div className="lesson-stack">
            {t.learn.cards.map((card, index) => (
              <div className={`lesson lesson-${index + 1}`} key={card}>
                <span>0{index + 1}</span>
                <strong>{card}</strong>
                <i aria-hidden="true">→</i>
              </div>
            ))}
          </div>
        </section>

        <section className="download-section" id="download">
          <p className="eyebrow">
            <span className="eyebrow-marker" />
            {t.download.eyebrow}
          </p>
          <h2>{t.download.title}</h2>
          <p className="download-body">{t.download.body}</p>
          <div className="platform-grid">
            {["Windows", "macOS", "Linux"].map((platform) => (
              <article className="platform-card" key={platform}>
                <span className="platform-icon" aria-hidden="true">
                  {platform === "Windows" ? "⊞" : platform === "macOS" ? "●" : "⌘"}
                </span>
                <h3>{platform}</h3>
                <span className="soon-label">{t.download.soon}</span>
              </article>
            ))}
          </div>
          <div className="download-footer">
            <span>
              <i />
              {t.download.status}
            </span>
            <a className="text-link" href={installation} target="_blank" rel="noreferrer">
              {t.download.install} <span aria-hidden="true">↗</span>
            </a>
          </div>
        </section>
      </main>

      <footer>
        <div className="footer-brand">
          <span className="brand-mark">K</span>
          <div>
            <strong>Kobrixa</strong>
            <p>{t.footer.description}</p>
          </div>
        </div>
        <div className="footer-links">
          <a href="/docs">{t.footer.docs}</a>
          <a
            href={`${github}/tree/main/docs/${locale === "zh-TW" ? "zh-TW" : "en"}`}
            target="_blank"
            rel="noreferrer"
          >
            GitHub {t.footer.docs} ↗
          </a>
          <a href={github} target="_blank" rel="noreferrer">
            GitHub
          </a>
          <a href={`${github}/blob/main/LICENSE`} target="_blank" rel="noreferrer">
            {t.footer.license}
          </a>
        </div>
        <p className="trademark">{t.footer.trademark}</p>
      </footer>
    </>
  );
}

function App() {
  const [locale, setLocale] = useState<Locale>(() =>
    localStorage.getItem("kobrixa-locale") === "en" ? "en" : "zh-TW",
  );
  const [path, setPath] = useState(() => window.location.pathname);
  const isDocs = path === "/docs" || path.startsWith("/docs/");

  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    localStorage.setItem("kobrixa-locale", locale);
    if (!isDocs)
      document.title =
        locale === "zh-TW" ? "Kobrixa — 用程式驅動創意" : "Kobrixa — Make ideas move with code";
  }, [isDocs, locale]);

  const toggleLocale = () => setLocale((current) => (current === "zh-TW" ? "en" : "zh-TW"));
  return isDocs ? (
    <DocsPage locale={locale} onLocaleChange={setLocale} path={path} />
  ) : (
    <HomePage locale={locale} toggleLocale={toggleLocale} />
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
