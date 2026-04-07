import { createRequire } from "module";
import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// Resolve the bootstrap/scss directory that @axelor/ui actually uses in the pnpm store.
// sass-embedded can't resolve sibling @import ("variables-dark") inside bootstrap's
// _variables.scss when the file is loaded via Vite's custom importer — loadPaths fixes this.
const require = createRequire(import.meta.url);
const axelorUiDir = path.dirname(require.resolve("@axelor/ui"));
const axelorUiRequire = createRequire(path.join(axelorUiDir, "index.js"));
const bootstrapScssDir = path.join(
  path.dirname(axelorUiRequire.resolve("bootstrap/package.json")),
  "scss",
);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    base: "./",
    resolve: {
      dedupe: ["react", "react-dom"],
    },
    build: {
      outDir: "build",
      chunkSizeWarningLimit: 2000,
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, "index.html"),
        },
      },
    },
    css: {
      preprocessorOptions: {
        scss: {
          api: "modern-compiler",
          silenceDeprecations: ["import", "legacy-js-api", "global-builtin"],
          loadPaths: [bootstrapScssDir],
        },
      },
    },
    plugins: [react()],
    server: {
      fs: {
        // Allow serving files from the workspace root (needed for @axelor/ui SCSS in hoisted node_modules)
        allow: [path.resolve(__dirname, "..")],
      },
      proxy: env.VITE_PROXY_CONTEXT
        ? {
            [env.VITE_PROXY_CONTEXT]: {
              target: env.VITE_PROXY_TARGET,
              changeOrigin: true,
              ws: true,
            },
          }
        : undefined,
    },
  };
});
