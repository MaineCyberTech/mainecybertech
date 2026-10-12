import { setCircuitBreakerStatus } from "./metrics";

export type CircuitState = "closed" | "open" | "half-open";

export interface CircuitBreakerConfig {
  failureThreshold: number;
  successThreshold: number;
  timeout: number;
  monitoringWindow?: number;
}

export interface CircuitBreakerStats {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailure?: Date;
  lastSuccess?: Date;
  nextAttempt?: Date;
}

export class CircuitBreaker {
  private state: CircuitState = "closed";
  private failures = 0;
  private successes = 0;
  private lastFailure?: Date;
  private lastSuccess?: Date;
  private nextAttempt?: Date;
  private readonly config: Required<CircuitBreakerConfig>;
  private readonly name: string;

  constructor(config: CircuitBreakerConfig, name = "default") {
    this.config = {
      failureThreshold: config.failureThreshold,
      successThreshold: config.successThreshold,
      timeout: config.timeout,
      monitoringWindow: config.monitoringWindow ?? 60_000,
    };
    this.name = name;
  }

  getState(): CircuitBreakerStats {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      lastFailure: this.lastFailure,
      lastSuccess: this.lastSuccess,
      nextAttempt: this.nextAttempt,
    };
  }

  isAvailable(): boolean {
    if (this.state === "closed") return true;

    if (this.state === "open") {
      if (this.nextAttempt && Date.now() >= this.nextAttempt.getTime()) {
        this.state = "half-open";
        this.successes = 0;
        return true;
      }
      return false;
    }

    return true;
  }

  /**
   * Run `operation` under the breaker with a hard deadline.
   *
   * RES-P3-007: the timeout timer is cleared in `finally` (the previous
   * version leaked one pending timer per call until it fired) and the
   * operation receives an AbortSignal that fires with the timeout, so a
   * timed-out call can cancel its underlying work instead of continuing in
   * the background. Callers that pass no signal-accepting operation are
   * unaffected — the signal is simply unused.
   */
  async execute<T>(operation: (signal: AbortSignal) => Promise<T>): Promise<T> {
    if (!this.isAvailable()) {
      throw new Error("Circuit breaker is OPEN");
    }

    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const op = operation(controller.signal);
      // The loser of the race below may still reject later; swallow it so it
      // is not an unhandled rejection (the caller already saw the timeout).
      op.catch(() => {});
      const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          // Settle the race with the breaker error BEFORE aborting: the abort
          // synchronously rejects the operation, and racing that rejection
          // first would surface the operation's abort error to the caller
          // instead of "Circuit breaker timeout".
          reject(new Error("Circuit breaker timeout"));
          controller.abort(new Error("Circuit breaker timeout"));
        }, this.config.timeout);
      });
      const result = await Promise.race([op, timeout]);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    } finally {
      // RES-P3-007: never leave the deadline timer pending after the call
      // settles (it kept the event loop busy and fired against settled calls).
      if (timer) clearTimeout(timer);
    }
  }

  private emitState(): void {
    setCircuitBreakerStatus(this.name, this.state);
  }

  private onSuccess(): void {
    this.failures = 0;
    this.lastSuccess = new Date();

    if (this.state === "half-open") {
      this.successes++;
      if (this.successes >= this.config.successThreshold) {
        this.state = "closed";
        this.successes = 0;
      }
    }
    this.emitState();
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailure = new Date();

    if (this.state === "half-open") {
      this.state = "open";
      this.nextAttempt = new Date(Date.now() + this.config.timeout);
    } else if (this.state === "closed" && this.failures >= this.config.failureThreshold) {
      this.state = "open";
      this.nextAttempt = new Date(Date.now() + this.config.timeout);
    }
    this.emitState();
  }

  reset(): void {
    this.state = "closed";
    this.failures = 0;
    this.successes = 0;
    this.lastFailure = undefined;
    this.lastSuccess = undefined;
    this.nextAttempt = undefined;
  }
}

export function createSupabaseCircuitBreaker(): CircuitBreaker {
  return new CircuitBreaker({
    failureThreshold: 5,
    successThreshold: 2,
    timeout: 30_000,
    monitoringWindow: 60_000,
  }, "supabase");
}
