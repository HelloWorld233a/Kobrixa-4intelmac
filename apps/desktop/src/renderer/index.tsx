import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app.js";
import "./styles/index.css";
import { applyAppearance } from "./settings/settings.js";
import { settingsStore } from "./settings/settings-state.js";
import { initializeEditorServices } from "./editor/monaco-services.js";
import { initAllPlugins } from "./plugins/plugin-manager.js";

initializeEditorServices();
applyAppearance(settingsStore.getSnapshot().values, document.documentElement);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// 在 React 根節點掛載後啟動所有已啟用的插件，並由 MutationObserver 確保跨頁面切換自動掛載
initAllPlugins();
