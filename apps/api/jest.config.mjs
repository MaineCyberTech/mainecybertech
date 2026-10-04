export default {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.ts", "**/?(*.)+(spec|test).ts"],
  testPathIgnorePatterns: ["/node_modules/", "helpers\\.ts$", "/openapi/"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.d.ts",
    "!src/**/index.ts",
    "!src/**/__tests__/**",
  ],
  coverageThreshold: {
    // TEST-P3-001: ratcheted from 30/50/55/58 to just below the measured
    // coverage (2026-10-03: branches 49.7, functions 75.3, lines 78.7,
    // statements 72.9) so erosion fails CI instead of accumulating silently.
    global: {
      branches: 45,
      functions: 70,
      lines: 74,
      statements: 70,
    },
  },
  moduleNameMapper: {
    "^(\\.\\.?\\/.*)\\.js$": "$1",
    "^redis$": "<rootDir>/src/__mocks__/redis.ts",
  },
};
