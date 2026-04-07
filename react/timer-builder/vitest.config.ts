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
      exclude: ["src/**/__tests__/**", "src/index.tsx"],
      // One-way ratchet: vitest auto-updates thresholds after passing runs.
      // Commit updated values with your changes — CI uses them as floor.
      thresholds: {
        autoUpdate: true,
        statements: 84.84,
        branches: 77.5,
        functions: 35.29,
        lines: 84.84,
      },
    },
  },
});