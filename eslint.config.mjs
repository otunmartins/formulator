import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// eslint-config-next registers jsx-a11y but only enables a handful of its rules.
// pnpm doesn't hoist the plugin, so take its recommended rules from the instance
// Next already loaded (CODING_STANDARDS §15).
const jsxA11y = nextVitals.find((c) => c.plugins?.["jsx-a11y"])?.plugins["jsx-a11y"];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    name: "excipient-screen/a11y",
    rules: { ...jsxA11y?.flatConfigs.recommended.rules },
  },
  {
    name: "excipient-screen/strict",
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "playwright-report/**",
    "test-results/**",
  ]),
]);

export default eslintConfig;
