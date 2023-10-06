import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import svgrPlugin from "vite-plugin-svgr";
import path from "path";
import dns from "dns";

dns.setDefaultResultOrder("verbatim");

const env = loadEnv("dev", process.cwd(), "");
const base =
  env.NODE_ENV === "production" ? "./" : env.VITE_PROXY_CONTEXT ?? "/";

export default defineConfig({
  base,
  build: {
    outDir: "build",
    chunkSizeWarningLimit: 1600,
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
      [path.join(env.VITE_PROXY_CONTEXT, "ws")]: {
        target: env.VITE_PROXY_TARGET,
        changeOrigin: true,
        ws: true,
      },
    },
  },
});
