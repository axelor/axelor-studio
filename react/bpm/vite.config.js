import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import svgrPlugin from "vite-plugin-svgr";
import path from "path";
import dns from "dns";

dns.setDefaultResultOrder("verbatim");
const env = loadEnv("dev", process.cwd(), "");

export default defineConfig({
  base: "./",
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
      svgrOptions: {
        icon: true,
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
      "/api/": {
        target: "https://connect.axelor.com/",
        changeOrigin: true,
        ws: true,
      },
    },
  },
});
