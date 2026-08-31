import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  css: {
    preprocessorOptions: {
      scss: {
        // Gebruik de moderne sass-API; voorkomt de "legacy-js-api"-waarschuwingen.
        api: "modern-compiler",
      },
    },
  },
  build: {
    outDir: "dist",
    assetsInlineLimit: 0,
  },
});
