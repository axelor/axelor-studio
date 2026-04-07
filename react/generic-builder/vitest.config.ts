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
    server: {
      ...sharedTestConfig.server,
      deps: {
        ...sharedTestConfig.server?.deps,
        inline: [...(sharedTestConfig.server?.deps?.inline ?? []), /dayjs/],
      },
    },
    coverage: {
      ...sharedCoverageConfig,
      reportsDirectory: "./coverage",
      include: ["src/**/*.{js,jsx,ts,tsx}"],
      exclude: ["src/**/__tests__/**"],
      // One-way ratchet: vitest auto-updates thresholds after passing runs.
      // Commit updated values with your changes — CI uses them as floor.
      thresholds: {
        autoUpdate: true,
        statements: 26.73,
        branches: 60.24,
        functions: 41.02,
        lines: 26.73,
      },
    },
  },
});