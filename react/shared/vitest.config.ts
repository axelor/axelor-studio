import path from "path";
import { defineConfig } from "vitest/config";
import {
  sharedCoverageConfig,
  sharedPlugins,
  sharedResolve,
  sharedTestConfig,
} from "../vitest.shared.config";

export default defineConfig({
  plugins: sharedPlugins,
  resolve: {
    ...sharedResolve,
    alias: {
      // monaco-editor has no `main` or `exports` in its package.json (only `module`).
      // Vite 7.x cannot resolve the entry, causing test collection to fail.
      // Alias to a lightweight mock so tests can run without bundling the real 5MB Monaco.
      "monaco-editor": path.resolve(
        __dirname,
        "src/components/__tests__/__mocks__/monaco-editor.ts",
      ),
    },
  },
  test: {
    ...sharedTestConfig,
    coverage: {
      ...sharedCoverageConfig,
      reportsDirectory: "./coverage",
      include: ["src/**/*.{js,jsx,ts,tsx}"],
      exclude: ["src/**/__tests__/**"],
      // One-way ratchet: vitest auto-updates thresholds after passing runs.
      // Commit updated values with your changes — CI uses them as floor.
      thresholds: {
        autoUpdate: true,
        statements: 30.94,
        branches: 60.71,
        functions: 53.1,
        lines: 30.94,
      },
    },
  },
});