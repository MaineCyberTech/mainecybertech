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

  constructor(config: CircuitBreakerConfig) {
    this.config = {
      failureThreshold: config.failureThreshold,
      successThreshold: config.successThreshold,
      timeout: config.timeout,
      monitoringWindow: config.monitoringWindow ?? 60_000,
    };
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

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (!this.isAvailable()) {
      throw new Error("Circuit breaker is OPEN");
    }

    try {
      const result = await Promise.race([
        operation(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Circuit breaker timeout")), this.config.timeout),
        ),
      ]);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
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
  });
}
