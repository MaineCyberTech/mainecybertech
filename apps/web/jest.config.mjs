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
    "src/**/*.ts",
    "app/**/*.ts",
    "!src/**/*.d.ts",
    "!**/*.config.ts",
  ],
  coverageThreshold: {
    global: {
      branches: 25,
      functions: 30,
      lines: 35,
      statements: 35,
    },
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testPathIgnorePatterns: [".next", "node_modules", "e2e"],
  transformIgnorePatterns: ["/node_modules/(?!(marked)/)"],
};
