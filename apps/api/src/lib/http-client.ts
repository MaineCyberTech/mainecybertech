import {
  CircuitBreaker,
  createSupabaseCircuitBreaker,
} from "./circuit-breaker";

export interface HttpClientConfig {
  timeout: number;
  maxRetries: number;
  retryDelay: number;
  circuitBreaker?: CircuitBreaker;
}

export interface FetchOptions extends RequestInit {
  timeout?: number;
}

const defaultConfig: HttpClientConfig = {
  timeout: 10_000,
  maxRetries: 3,
  retryDelay: 1_000,
};

export class HttpClient {
  private readonly config: HttpClientConfig;
  private readonly circuitBreaker: CircuitBreaker;

  constructor(config: Partial<HttpClientConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.circuitBreaker =
      this.config.circuitBreaker ?? createSupabaseCircuitBreaker();
  }

  async fetch(url: string, options: FetchOptions = {}): Promise<Response> {
    const { timeout = this.config.timeout, ...fetchOptions } = options;

    if (!this.circuitBreaker.isAvailable()) {
      throw new Error(`Circuit breaker open for ${url}`);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const finalOptions: RequestInit = {
      ...fetchOptions,
      signal: controller.signal,
    };

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        const response = await this.circuitBreaker.execute(() =>
          fetch(url, finalOptions),
        );
        clearTimeout(timeoutId);
        return response;
      } catch (error) {
        clearTimeout(timeoutId);
        lastError = error instanceof Error ? error : new Error(String(error));

        if (error instanceof Error && error.name === "AbortError") {
          throw new Error(`Request timeout after ${timeout}ms`);
        }

        if (attempt < this.config.maxRetries) {
          await this.sleep(this.config.retryDelay * (attempt + 1));
        }
      }
    }

    throw lastError ?? new Error("Request failed");
  }

  async get(url: string, options: FetchOptions = {}): Promise<Response> {
    return this.fetch(url, { ...options, method: "GET" });
  }

  async post(
    url: string,
    body: unknown,
    options: FetchOptions = {},
  ): Promise<Response> {
    return this.fetch(url, {
      ...options,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      body: JSON.stringify(body),
    });
  }

  async put(
    url: string,
    body: unknown,
    options: FetchOptions = {},
  ): Promise<Response> {
    return this.fetch(url, {
      ...options,
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      body: JSON.stringify(body),
    });
  }

  async patch(
    url: string,
    body: unknown,
    options: FetchOptions = {},
  ): Promise<Response> {
    return this.fetch(url, {
      ...options,
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      body: JSON.stringify(body),
    });
  }

  async delete(url: string, options: FetchOptions = {}): Promise<Response> {
    return this.fetch(url, { ...options, method: "DELETE" });
  }

  getCircuitBreaker(): CircuitBreaker {
    return this.circuitBreaker;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export function createHttpClient(
  config?: Partial<HttpClientConfig>,
): HttpClient {
  return new HttpClient(config);
}

export const httpClient = createHttpClient();

export const httpClients = {
  stripe: createHttpClient({ timeout: 15_000, maxRetries: 2 }),
  jsm: createHttpClient({ timeout: 15_000, maxRetries: 2 }),
  teams: createHttpClient({ timeout: 10_000, maxRetries: 1 }),
  geo: createHttpClient({ timeout: 5_000, maxRetries: 1 }),
};
