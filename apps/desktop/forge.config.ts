import type { ForgeConfig } from "@electron-forge/shared-types";
import { VitePlugin } from "@electron-forge/plugin-vite";

const config: ForgeConfig = {
  packagerConfig: {
    name: "Kobrixa",
    executableName: "kobrixa",
    asar: true,
  },
  rebuildConfig: {},
  makers: [],
  plugins: [
    new VitePlugin({
      build: [
        { entry: "src/main/index.ts", config: "vite.main.config.ts", target: "main" },
        { entry: "src/preload/index.ts", config: "vite.preload.config.ts", target: "preload" },
      ],
      renderer: [{ name: "main_window", config: "vite.renderer.config.ts" }],
    }),
  ],
};

export default config;
