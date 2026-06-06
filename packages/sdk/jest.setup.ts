import { jest } from "@jest/globals";

// Use fake timers for tests that involve timeouts/retries
beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
  jest.clearAllMocks();
});
