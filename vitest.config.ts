import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    testTimeout: 30000,
    include: ["src/**/*.test.ts"],
    coverage: {
      include: [
        "src/domain/**",
        "src/app/**",
        "src/solver/types.ts",
        "src/solver/twophase/**",
        "src/rendering/moveRotation.ts",
      ],
      exclude: ["src/**/*.test.ts"],
      reporter: ["text", "lcov"],
      thresholds: {
        statements: 90,
        branches: 85,
        functions: 90,
        lines: 90,
      },
    },
  },
});
