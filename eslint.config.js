import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", "node_modules", "*.config.js"] },
  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      ...tseslint.configs.stylistic
    ],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      // React Hooks
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],

      // TypeScript
      "@typescript-eslint/no-explicit-any": "warn", // <- not blocking
      "@typescript-eslint/no-unused-vars": ["warn", { 
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_" 
      }],
      "@typescript-eslint/consistent-type-definitions": ["warn", "interface"],

      // Logging
      "no-console": "off", // allow console.log during dev

      // Clean code
      "prefer-const": "warn",
      "no-var": "error",
      "eqeqeq": ["warn", "always"],

      // Simplified magic numbers rule
      "no-magic-numbers": ["warn", { 
        "ignore": [-1, 0, 1, 2, 100, 1000],
        "ignoreArrayIndexes": true,
        "ignoreDefaultValues": true,
        "enforceConst": true
      }]
    },
    settings: {
      react: {
        version: "detect"
      }
    }
  }
);
