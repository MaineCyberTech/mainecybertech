export interface RedisClientType {
  connect(): Promise<void>;
  get(key: string): Promise<string | null>;
  setEx(key: string, seconds: number, value: string): Promise<void>;
  quit(): Promise<void>;
  flushDb(): Promise<void>;
  keys(pattern: string): Promise<string[]>;
  del(...keys: string[]): Promise<number>;
  on(event: string, listener: (...args: unknown[]) => void): void;
  ping(): Promise<string>;
}

export function createClient(_options?: {
  url?: string;
  password?: string;
  socket?: unknown;
}): RedisClientType {
  return {
    connect: () => Promise.resolve(undefined),
    get: () => Promise.resolve(null),
    setEx: () => Promise.resolve(undefined),
    quit: () => Promise.resolve(undefined),
    flushDb: () => Promise.resolve(undefined),
    keys: () => Promise.resolve([]),
    del: () => Promise.resolve(0),
    on: () => {},
    ping: () => Promise.resolve("PONG"),
  };
}
