import type { ApiResponse, PaginatedResult } from "./types";

export interface RetryOptions {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffFactor: number;
  retryableStatuses: number[];
}

export interface ClientOptions {
  baseUrl: string;
  getToken?: () => Promise<string | null>;
  timeoutMs?: number;
  retries?: Partial<RetryOptions>;
}

const DEFAULT_RETRY: RetryOptions = {
  maxRetries: 3,
  initialDelayMs: 200,
  maxDelayMs: 5000,
  backoffFactor: 2,
  retryableStatuses: [429, 502, 503, 504],
};

function buildQuery(
  params?: Record<string, string | number | undefined>,
): string {
  if (!params) return "";
  const entries = Object.entries(params).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return "";
  return (
    "?" +
    entries
      .map(
        ([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`,
      )
      .join("&")
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class ApiClient {
  private baseUrl: string;
  private getToken: () => Promise<string | null>;
  private timeoutMs: number;
  private retry: RetryOptions;

  constructor(opts: ClientOptions) {
    this.baseUrl = opts.baseUrl.replace(/\/+$/, "");
    this.getToken = opts.getToken ?? (async () => null);
    this.timeoutMs = opts.timeoutMs ?? 30_000;
    this.retry = { ...DEFAULT_RETRY, ...opts.retries };
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    params?: Record<string, string | number | undefined>,
  ): Promise<T> {
    const token = await this.getToken();
    const url = `${this.baseUrl}${path}${buildQuery(params)}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.retry.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.timeoutMs);

        const res = await fetch(url, {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
          credentials: "include",
        });

        clearTimeout(timer);

        const json: ApiResponse<T> = await res.json();

        if (!res.ok || !json.success) {
          const err = json.error ?? {
            code: "UNKNOWN",
            message: `HTTP ${res.status}`,
            status: res.status,
          };

          if (
            attempt < this.retry.maxRetries &&
            this.retry.retryableStatuses.includes(res.status)
          ) {
            const delay = Math.min(
              this.retry.initialDelayMs *
                Math.pow(this.retry.backoffFactor, attempt),
              this.retry.maxDelayMs,
            );
            await sleep(delay);
            continue;
          }

          throw new ApiError(
            err.code,
            err.message,
            err.status,
            err.details,
          );
        }

        return json.data as T;
      } catch (error) {
        if (error instanceof ApiError) throw error;

        if (
          attempt < this.retry.maxRetries &&
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          lastError = new Error(
            `Request timed out after ${this.timeoutMs}ms`,
          );
          continue;
        }

        if (attempt < this.retry.maxRetries) {
          const delay = Math.min(
            this.retry.initialDelayMs *
              Math.pow(this.retry.backoffFactor, attempt),
            this.retry.maxDelayMs,
          );
          await sleep(delay);
          lastError = error as Error;
          continue;
        }

        throw error;
      }
    }

    throw lastError ?? new Error("Max retries exceeded");
  }

  get<T>(
    path: string,
    params?: Record<string, string | number | undefined>,
  ): Promise<T> {
    return this.request<T>("GET", path, undefined, params);
  }

  post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("POST", path, body);
  }

  patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("PATCH", path, body);
  }

  put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("PUT", path, body);
  }

  delete<T>(path: string): Promise<T> {
    return this.request<T>("DELETE", path);
  }

  async postFormData<T>(path: string, formData: FormData): Promise<T> {
    const token = await this.getToken();
    const url = `${this.baseUrl}${path}`;

    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.retry.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.timeoutMs);

        const res = await fetch(url, {
          method: "POST",
          headers,
          body: formData,
          signal: controller.signal,
          credentials: "include",
        });

        clearTimeout(timer);

        const json: ApiResponse<T> = await res.json();

        if (!res.ok || !json.success) {
          const err = json.error ?? {
            code: "UNKNOWN",
            message: `HTTP ${res.status}`,
            status: res.status,
          };

          if (
            attempt < this.retry.maxRetries &&
            this.retry.retryableStatuses.includes(res.status)
          ) {
            const delay = Math.min(
              this.retry.initialDelayMs *
                Math.pow(this.retry.backoffFactor, attempt),
              this.retry.maxDelayMs,
            );
            await sleep(delay);
            continue;
          }

          throw new ApiError(
            err.code,
            err.message,
            err.status,
            err.details,
          );
        }

        return json.data as T;
      } catch (error) {
        if (error instanceof ApiError) throw error;

        if (
          attempt < this.retry.maxRetries &&
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          lastError = new Error(
            `Request timed out after ${this.timeoutMs}ms`,
          );
          continue;
        }

        if (attempt < this.retry.maxRetries) {
          const delay = Math.min(
            this.retry.initialDelayMs *
              Math.pow(this.retry.backoffFactor, attempt),
            this.retry.maxDelayMs,
          );
          await sleep(delay);
          lastError = error as Error;
          continue;
        }

        throw error;
      }
    }

    throw lastError ?? new Error("Max retries exceeded");
  }
}

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
    public details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}