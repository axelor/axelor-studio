import react from "@vitejs/plugin-react";
import type { PluginOption } from "vite";
import type { UserConfig } from "vitest/config";

/** Base plugins (react only). Use sharedPluginsWithSvgr() for SVG support. */
export const sharedPlugins: PluginOption[] = [react()];

/**
 * Create plugins array with vite-plugin-svgr.
 * Caller must pass the svgrPlugin import since shared package lacks the dep.
 */
export function sharedPluginsWithSvgr(
  svgrPlugin: (options: Record<string, unknown>) => PluginOption,
): PluginOption[] {
  return [
    react(),
    svgrPlugin({
      include: "**/*.svg",
      svgrOptions: {
        icon: true,
        exportType: "default",
      },
    }),
  ];
}

export const sharedTestConfig: UserConfig["test"] = {
  globals: true,
  environment: "jsdom",
  setupFiles: ["./vitest.setup.ts"],
  server: {
    deps: {
      inline: [/@axelor\/ui/],
    },
  },
  include: ["src/**/__tests__/**/*.test.{js,jsx,ts,tsx}"],
};

export const sharedResolve: UserConfig["resolve"] = {
  extensions: [".mjs", ".js", ".mts", ".ts", ".jsx", ".tsx", ".json"],
};

/** Base coverage config shared across all packages */
export const sharedCoverageConfig = {
  provider: "v8" as const,
  reporter: ["text", "text-summary", "html", "json-summary", "cobertura"] as const,
  reportOnFailure: true,
};
