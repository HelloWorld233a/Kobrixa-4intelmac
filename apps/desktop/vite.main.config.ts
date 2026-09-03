import { defineConfig } from "vite";

export default defineConfig({
  build: {
    sourcemap: true,
    rollupOptions: {
      external: ["node-hid"],
      output: { entryFileNames: "main.cjs" },
    },
  },
});
