import eslint from "@eslint/js";
import prettier from "eslint-config-prettier";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["coverage/", "dist/", "node_modules/", "playwright-report/", "test-results/"],
  },
  eslint.configs.recommended,
  {
    files: ["**/*.ts"],
    extends: [...tseslint.configs.recommended],
  },
  {
    files: ["src/**/*.ts"],
    extends: [...tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          fixStyle: "inline-type-imports",
          prefer: "type-imports",
        },
      ],
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
    },
  },
  {
    files: ["eslint.config.js"],
    languageOptions: {
      globals: {
        console: "readonly",
      },
    },
  },
  prettier,
);
