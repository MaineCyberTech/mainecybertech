export default {
  preset: "ts-jest",
  testEnvironment: "./jest-custom-environment.js",
  roots: ["<rootDir>/"],
  testMatch: [
    "**/__tests__/**/*.ts",
    "**/__tests__/**/*.tsx",
    "**/?(*.)+(spec|test).ts",
    "**/?(*.)+(spec|test).tsx",
  ],
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
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "^server-only$": "<rootDir>/__mocks__/server-only.js",
    "^@mct/ui/(.*)$": "<rootDir>/../../packages/ui/src/$1",
    "^@mct/ui$": "<rootDir>/../../packages/ui/src/index.ts",
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "app/**/*.{ts,tsx}",
    "components/**/*.{ts,tsx}",
    "lib/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!**/*.d.ts",
    "!**/*.config.{ts,tsx}",
    "!**/__tests__/**",
    "!**/*.test.{ts,tsx}",
    "!**/*.spec.{ts,tsx}",
    "!**/*.stories.{ts,tsx}",
  ],
  coverageThreshold: {
    // TEST-P3-001: ratcheted from 38/38/45/46 to just below the measured
    // coverage (2026-10-03: branches 41.3, functions 40.4, lines 49.7,
    // statements 48.9) so erosion fails CI instead of accumulating silently.
    global: {
      branches: 39,
      functions: 39,
      lines: 47,
      statements: 47,
    },
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testPathIgnorePatterns: [".next", "node_modules", "e2e"],
  transformIgnorePatterns: ["/node_modules/(?!(marked)/)"],
};
