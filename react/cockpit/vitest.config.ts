import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    extensions: [".mjs", ".js", ".mts", ".ts", ".jsx", ".tsx", ".json"],
  },
  test: {
    globals: true,
    environment: "jsdom",
    env: {
      // Service.ts builds baseURL from this var; undefined causes indexOf crash in tests
      VITE_PROXY_CONTEXT: "",
    },
    setupFiles: ["./vitest.setup.ts"],
    server: {
      deps: {
        inline: [/@axelor\/ui/],
      },
    },
    include: [
      "src/**/__tests__/**/*.test.{js,jsx,ts,tsx}",
      "src/**/__tests__/**/*.stub.{tsx,ts}",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary", "html", "json-summary", "cobertura"],
      reportOnFailure: true,
      reportsDirectory: "./coverage",
      include: ["src/**/*.{js,jsx,ts,tsx}"],
      exclude: ["src/**/__tests__/**"],
    },
  },
});
