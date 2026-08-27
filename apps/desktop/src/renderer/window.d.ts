import type { KobrixaApi } from "../shared/api.js";

declare global {
  interface Window {
    kobrixa: KobrixaApi;
  }
}

export {};
