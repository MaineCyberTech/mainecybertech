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
    // EVOL-P2-001 / EVOL-P2-002 / ADMIN-P3-001 / FEAT-P3-006 / NOTIF-P3-001 /
    // NOTIF-P3-005: the dependency-free shared catalogs/helpers and the email
    // template/unsubscribe-token helpers are imported via subpath exports; map
    // them to source so ts-jest compiles them regardless of package-exports
    // support.
    "^@mct/sdk/(module-registry|role-keys|ticket-status|webhook-events|email-template)$":
      "<rootDir>/../../packages/sdk/src/$1",
    // EVOL-P3-005: shared env schema source (ts-jest compiles it directly).
    "^@mct/config/env$": "<rootDir>/../../packages/config/src/env.ts",
  },
};
