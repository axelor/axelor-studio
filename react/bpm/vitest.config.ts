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
      exclude: ["src/**/__tests__/**", "src/**/icons/**"],
      // One-way ratchet: vitest auto-updates thresholds after passing runs.
      // Commit updated values with your changes — CI uses them as floor.
      thresholds: {
        autoUpdate: true,
        statements: 15.08,
        branches: 62.84,
        functions: 34.19,
        lines: 15.08,
      },
    },
  },
});