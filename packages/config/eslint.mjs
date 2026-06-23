export default [
  {
    ignores: ["dist/", "node_modules/", ".turbo/"],
  },
  {
    files: ["src/**/*.{ts,tsx,js}"],
    rules: {
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "prefer-const": "error",
      "no-floating-decimal": "error",
    },
  },
];
