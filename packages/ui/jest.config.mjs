export default {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.test.ts", "**/__tests__/**/*.test.tsx"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  moduleNameMapper: {
    // The components import their siblings through the `@mct/ui/*` subpaths;
    // map them to source so the suite exercises the package's own files.
    "^@mct/ui/(.*)$": "<rootDir>/src/$1",
    "^@mct/ui$": "<rootDir>/src/index.ts",
  },
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: {
          jsx: "react-jsx",
        },
      },
    ],
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/*.stories.tsx",
    "!src/**/__tests__/**",
  ],
  // TEST-P3-005: no coverageThreshold yet — the first CI run measures the
  // smoke-suite floor and the threshold is set just below that measurement in
  // the follow-up (same ratchet policy as apps/*, see docs/testing.md).
};
