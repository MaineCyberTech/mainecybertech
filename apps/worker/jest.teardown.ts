// Cleanup async operations after all tests
export default async function globalTeardown(): Promise<void> {
  // Clear any pending timers
  const timers = (global as any).__JEST_TIMERS__;
  if (timers) {
    timers.forEach((t: NodeJS.Timeout) => clearTimeout(t));
    timers.forEach((t: NodeJS.Timeout) => clearInterval(t));
  }
}
