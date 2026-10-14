import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "@kobrixa/plugin-runtime",
    include: ["src/**/*.test.ts"],
  },
});
