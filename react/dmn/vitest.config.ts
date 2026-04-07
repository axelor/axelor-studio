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
        statements: 10.52,
        branches: 52.6,
        functions: 30.95,
        lines: 10.52,
      },
    },
  },
});