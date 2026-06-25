declare module "redis" {
  export interface RedisClientType {
    connect(): Promise<void>;
    get(key: string): Promise<string | null>;
    setEx(key: string, seconds: number, value: string): Promise<void>;
    quit(): Promise<void>;
    flushDb(): Promise<void>;
    keys(pattern: string): Promise<string[]>;
    del(...keys: string[]): Promise<number>;
  }

  export function createClient(options: { url: string }): RedisClientType;
}
