import svgrPlugin from "vite-plugin-svgr";
import { defineConfig } from "vitest/config";
import type { UserConfig } from "vitest/config";

import {
  sharedCoverageConfig,
  sharedPluginsWithSvgr,
  sharedResolve,
  sharedTestConfig,
} from "../vitest.shared.config";

export default defineConfig({
  plugins: sharedPluginsWithSvgr(svgrPlugin),
  resolve: sharedResolve as UserConfig["resolve"],
  test: {
    ...(sharedTestConfig as UserConfig["test"]),
    coverage: {
      ...sharedCoverageConfig,
      reportsDirectory: "./coverage",
      include: ["src/**/*.{js,jsx,ts,tsx}"],
      exclude: ["src/**/__tests__/**"],
      // One-way ratchet: vitest auto-updates thresholds after passing runs.
      // Commit updated values with your changes — CI uses them as floor.
      thresholds: {
        autoUpdate: true,
        statements: 57.9,
        branches: 70.37,
        functions: 46,
        lines: 57.9,
      },
    },
  },
});