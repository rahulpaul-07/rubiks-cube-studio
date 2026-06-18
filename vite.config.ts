import { defineConfig } from "vite";

export default defineConfig({
  build: {
    chunkSizeWarningLimit: 650,
    sourcemap: true,
  },
});
