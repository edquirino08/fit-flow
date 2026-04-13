import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "fit-flow-mark.svg"],
      manifest: {
        name: "Fit Flow",
        short_name: "Fit Flow",
        description: "Fichas de treino com cargas por fase e exportação PDF",
        theme_color: "#0a0a0a",
        background_color: "#f2f2f2",
        display: "standalone",
        orientation: "portrait",
        icons: [
          {
            src: "/favicon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,svg,png,woff2}"],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@fit-flow/domain": path.resolve(
        __dirname,
        "../packages/domain/src/index.ts",
      ),
    },
  },
});
