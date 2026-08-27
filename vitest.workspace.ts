import { defineWorkspace } from "vitest/config";

export default defineWorkspace(["packages/*/vitest.config.ts", "frontends/*/vitest.config.ts"]);
