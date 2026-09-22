import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@meteora-ag/dlmm": path.resolve(__dirname, "../../node_modules/@meteora-ag/dlmm/dist/index.js"),
    },
  },
});
