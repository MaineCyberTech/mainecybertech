/**
 * Navigation wrapper.
 *
 * jsdom 30 makes window.location (and its methods) non-configurable, so tests
 * cannot replace or spy on `location.assign`. Keeping the call behind this
 * helper lets tests mock navigation cleanly.
 */
export function redirectTo(url: string): void {
  if (typeof window !== "undefined") {
    window.location.assign(url);
  }
}
