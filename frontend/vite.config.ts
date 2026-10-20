import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const proxy = {
    "/api": {
      target: env.API_BACKEND_URL || "http://127.0.0.1:5000",
      changeOrigin: true,
    },
  };
  return {
    base: "/static/painel/",
    plugins: [
      react(),
      tailwindcss(),
      {
        name: "sigir-unificar-entradas",
        async writeBundle() {
          const html = await readFile(
            resolve(process.cwd(), "../static/painel/index.html"),
            "utf8",
          );
          await Promise.all(
            [
              "index",
              "dashboard",
              "estoque",
              "farmacos",
              "fornecedores",
              "movimentacoes",
            ].map((p) =>
              writeFile(
                resolve(process.cwd(), `../templates/html/${p}.html`),
                html,
              ),
            ),
          );
        },
      },
    ],
    build: {
      outDir: "../static/painel",
      emptyOutDir: true,
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
