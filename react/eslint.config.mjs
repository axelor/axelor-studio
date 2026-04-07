import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import importX from "eslint-plugin-import-x";
import globals from "globals";

export default tseslint.config(
  // Global ignores
  {
    ignores: [
      "**/dist/**",
      "**/build/**",
      "**/node_modules/**",
      "**/coverage/**",
    ],
  },

  // Base: recommended type-checked rules
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      globals: { ...globals.browser },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      "import-x": importX,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "no-console": "warn",
      "import-x/order": ["warn", { "newlines-between": "always" }],
      "import-x/no-duplicates": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],

      // Type-checked rules downgraded to warn: codebase has pervasive `any` from
      // recent JS->TS migration (v1.0-v1.2). These produce 9000+ cascading errors
      // that require full type rewrite. Kept as warnings so they surface in IDE
      // and can be incrementally resolved. Correctness rules stay as errors.
      "@typescript-eslint/no-unsafe-assignment": "warn",
      "@typescript-eslint/no-unsafe-member-access": "warn",
      "@typescript-eslint/no-unsafe-call": "warn",
      "@typescript-eslint/no-unsafe-return": "warn",
      "@typescript-eslint/no-unsafe-argument": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/restrict-template-expressions": "warn",
      "@typescript-eslint/no-base-to-string": "warn",
      "@typescript-eslint/restrict-plus-operands": "warn",
      "@typescript-eslint/no-redundant-type-constituents": "warn",
      // Additional type-checked rules downgraded: high error volume from JS->TS
      // migration patterns. Fix incrementally alongside type improvements.
      "@typescript-eslint/no-floating-promises": "warn",
      "@typescript-eslint/no-misused-promises": "warn",
      "@typescript-eslint/require-await": "warn",
      "@typescript-eslint/no-unused-expressions": "warn",
      "@typescript-eslint/ban-ts-comment": "warn",
      "@typescript-eslint/unbound-method": "warn",
      "@typescript-eslint/no-this-alias": "warn",
      "@typescript-eslint/prefer-promise-reject-errors": "warn",
      "@typescript-eslint/no-empty-object-type": "warn",
      "@typescript-eslint/no-non-null-asserted-optional-chain": "warn",
    },
  },

  // bpmn-js private API override for bpm only
  {
    files: ["bpm/src/**/*.{ts,tsx,js,jsx}"],
    rules: {
      "no-restricted-properties": [
        "error",
        {
          property: "_definitions",
          message:
            "Use public bpmn-js API (getDefinitions()). See modeler-api.js for wrappers.",
        },
        {
          property: "_elements",
          message:
            "Use public bpmn-js API (elementRegistry.getAll() or elementRegistry.get(id)).",
        },
        {
          property: "_viewers",
          message: "Use public bpmn-js API.",
        },
        {
          property: "_activeView",
          message: "Use public bpmn-js API.",
        },
      ],
    },
  },

  // Tests may access bpmn-js internals for mocking/characterization
  {
    files: ["bpm/src/**/__tests__/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-properties": "off",
    },
  },

  // Cross-boundary import guard for bpm package (D-10)
  // Warns on barrel imports from ../../shared/services in bpm source.
  // Direct file imports (e.g., ../../shared/services/wkf-service) remain allowed
  // as the intended escape hatch for bpm-local services.
  {
    files: ["bpm/src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["warn", {
        paths: [
          { name: "../shared/services", message: "Use @studio/shared/services or a direct bpm-local import instead of relative cross-boundary barrel path." },
          { name: "../../shared/services", message: "Use @studio/shared/services or a direct bpm-local import instead of relative cross-boundary barrel path." },
          { name: "../../../shared/services", message: "Use @studio/shared/services or a direct bpm-local import instead of relative cross-boundary barrel path." },
          { name: "../../../../shared/services", message: "Use @studio/shared/services or a direct bpm-local import instead of relative cross-boundary barrel path." },
          { name: "../../../../../shared/services", message: "Use @studio/shared/services or a direct bpm-local import instead of relative cross-boundary barrel path." },
        ],
      }],
    },
  },

  // Disable type-checked rules on plain JS/JSX files
  { files: ["**/*.js", "**/*.jsx"], ...tseslint.configs.disableTypeChecked },
);
