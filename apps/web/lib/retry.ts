/**
 * Retry an idempotent async operation with linear backoff.
 *
 * The SDK already retries 429/502/503/504, but a transient 500 (common
 * during Supabase contention) surfaces immediately and, in the admin/portal
 * layouts, causes the whole authenticated shell to fall into the error
 * boundary. This helper absorbs those blips for read-only calls.
 *
 * Auth failures (401/403) and other client errors (400/404/...) are rethrown
 * immediately: retrying a request that is wrong by construction just delays
 * the inevitable, and for 401/403 it keeps callers from redirecting to /login.
 */
export interface RetryOptions {
  attempts?: number;
  baseDelayMs?: number;
}

export async function withRetry<T>(fn: () => Promise<T>, opts: RetryOptions = {}): Promise<T> {
  const { attempts = 3, baseDelayMs = 150 } = opts;
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const status = (err as { status?: number })?.status;
      if (typeof status === "number" && status >= 400 && status < 500) throw err;
      if (attempt < attempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, baseDelayMs * (attempt + 1)));
      }
    }
  }

  throw lastError;
}
