export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  // NOTIF-P3-001 / NOTIF-P3-005: shared email template + unsubscribe-token
  // helpers are imported via SDK subpath exports; map them to source so
  // ts-jest compiles them regardless of package-exports support.
  moduleNameMapper: {
    '^@mct/sdk/(email-template)$': '<rootDir>/../../packages/sdk/src/$1',
  },
  setupFiles: ['<rootDir>/jest.setup.ts'],
  globalTeardown: '<rootDir>/jest.teardown.ts',
  moduleNameMapper: {
    // EVOL-P3-005: shared env schema source (ts-jest compiles it directly).
    '^@mct/config/env$': '<rootDir>/../../packages/config/src/env.ts',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
  ],
  coverageThreshold: {
    // TEST-P2-002: the module-tasks suite landed, so the branch floor is no
    // longer a no-op. Measured worker branch coverage was ~54% before the
    // suite (2026-10-11); 25 keeps a wide margin for erosion.
    global: {
      branches: 25,
      functions: 15,
      lines: 12,
      statements: 12,
    },
  },
};
