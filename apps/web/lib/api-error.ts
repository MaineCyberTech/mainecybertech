import { ApiError } from "@mct/sdk";

/**
 * USE-P3-004: the API's optimistic-locking middleware rejects a write whose
 * `If-Match` version is stale with 409 VERSION_CONFLICT.
 */
export function isVersionConflict(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 409 || error.code === "VERSION_CONFLICT");
}

/** USE-P3-005: the SDK gives up retrying a timed-out request with this text. */
const TIMEOUT_HINT = /timed out|abort/i;

/**
 * Map any thrown value to a user-facing message. API errors keep their
 * message (they are already user-safe); timeouts get an explicit explanation;
 * anything else falls back to the caller's message rather than leaking a
 * raw exception or a bare "Request failed".
 */
export function formErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (isVersionConflict(error)) {
    return "This record was modified by someone else while you were editing. Reload the page and re-apply your change.";
  }

  if (error instanceof ApiError) {
    return error.message || fallback;
  }

  if (error instanceof Error && TIMEOUT_HINT.test(error.message)) {
    return "The server took too long to respond. Your change was not saved — check your connection and try again.";
  }

  return fallback;
}
