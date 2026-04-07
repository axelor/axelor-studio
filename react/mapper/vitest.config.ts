import svgrPlugin from "vite-plugin-svgr";
import { defineConfig } from "vitest/config";
import {
  sharedCoverageConfig,
  sharedPluginsWithSvgr,
  sharedResolve,
  sharedTestConfig,
} from "../vitest.shared.config";

export default defineConfig({
  plugins: sharedPluginsWithSvgr(svgrPlugin),
  resolve: sharedResolve,
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
        statements: 13.74,
        branches: 51.7,
        functions: 41.53,
        lines: 13.74,
      },
    },
  },
});