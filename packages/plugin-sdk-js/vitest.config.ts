import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "@kobrixa/plugin-sdk",
    include: ["src/**/*.test.ts"],
  },
});
