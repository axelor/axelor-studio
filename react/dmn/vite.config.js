import dns from "dns";
import path from "path";

import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import svgrPlugin from "vite-plugin-svgr";
import checker from "vite-plugin-checker";

dns.setDefaultResultOrder("verbatim");

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    base: "./",
    resolve: {
      dedupe: ['react', 'react-dom', 'moment', 'dmn-js-decision-table'],
    },
    build: {
      outDir: "build",
      chunkSizeWarningLimit: 4000,
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, "index.html"),
        },
      },
    },
    plugins: [
      react(),
      svgrPlugin({
        include: "**/*.svg",
        svgrOptions: {
          icon: true,
          exportType: "default",
        },
      }),
      checker({
        typescript: {
          tsconfigPath: "./tsconfig.json",
        },
        overlay: {
          initialIsOpen: false,
          position: "br",
        },
      }),
    ],
    server: {
      proxy: {
        [env.VITE_PROXY_CONTEXT]: {
          target: env.VITE_PROXY_TARGET,
          changeOrigin: true,
          ws: true,
        },
      },
    },
  };
});
