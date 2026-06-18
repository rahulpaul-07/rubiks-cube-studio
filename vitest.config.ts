import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    coverage: {
      include: ["src/domain/**", "src/app/**", "src/solver/types.ts"],
      reporter: ["text", "lcov"],
    },
  },
});
