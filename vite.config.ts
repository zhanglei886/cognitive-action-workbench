import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [react(), cloudflare()],
  // Capacitor 需要相对路径（file:// 协议加载）
  base: "./",
  build: {
    // 确保资源路径正确
    outDir: "dist",
    assetsDir: "assets",
  },
});