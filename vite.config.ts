import { defineConfig } from "vite";

export default defineConfig({
  build: {
    chunkSizeWarningLimit: 650,
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/three")) {
            return "three";
          }
          if (id.includes("node_modules/cubejs")) {
            return "cubejs";
          }
        },
      },
    },
  },
});
