import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const proxy = {
    "/api": {
      target: env.API_BACKEND_URL || "http://127.0.0.1:5000",
      changeOrigin: true,
    },
  };
  return {
    plugins: [react(), tailwindcss()],
    build: {
      rollupOptions: {
        output: {
          manualChunks: { charts: ["recharts"], motion: ["motion/react"] },
        },
      },
    },
    server: { proxy },
    preview: { proxy },
  };
});
