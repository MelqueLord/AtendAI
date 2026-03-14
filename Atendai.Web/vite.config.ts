import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@app": path.resolve(__dirname, "src/app"),
      "@features": path.resolve(__dirname, "src/features"),
      "@infrastructure": path.resolve(__dirname, "src/infrastructure"),
      "@shared": path.resolve(__dirname, "src/shared"),
      "@styles": path.resolve(__dirname, "src/styles")
    }
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:5155",
        changeOrigin: true,
        secure: false
      }
    }
  }
});
