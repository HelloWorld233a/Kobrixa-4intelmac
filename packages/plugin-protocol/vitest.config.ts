import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "@kobrixa/plugin-protocol",
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
