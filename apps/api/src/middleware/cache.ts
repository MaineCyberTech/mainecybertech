import { type Request, type Response, type NextFunction } from "express";

interface CacheEntry {
  data: unknown;
  expires: number;
}

const cache = new Map<string, CacheEntry>();
let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function ensureCleanupRunning() {
  if (!cleanupTimer) {
    cleanupTimer = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of cache) {
        if (entry.expires < now) {
          cache.delete(key);
        }
      }
    }, 60_000);
    cleanupTimer.unref();
  }
}

export function responseCache(ttlSeconds = 60) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== "GET") {
      return next();
    }

    ensureCleanupRunning();

    const key = `${req.path}:${JSON.stringify(req.query)}`;
    const entry = cache.get(key);

    if (entry && entry.expires > Date.now()) {
      res.setHeader("X-Cache", "HIT");
      return res.json(entry.data);
    }

    const originalJson = res.json.bind(res);
    res.json = (data: unknown) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(key, {
          data,
          expires: Date.now() + ttlSeconds * 1000,
        });
      }
      res.setHeader("X-Cache", "MISS");
      return originalJson(data);
    };
    next();
  };
}

export function responseCacheNoRenew(ttlSeconds = 60) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== "GET") {
      return next();
    }

    ensureCleanupRunning();

    const key = `${req.path}:${JSON.stringify(req.query)}`;
    const entry = cache.get(key);

    if (entry && entry.expires > Date.now()) {
      res.setHeader("X-Cache", "HIT");
      return res.json(entry.data);
    }

    const originalJson = res.json.bind(res);
    res.json = (data: unknown) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        if (!cache.has(key)) {
          cache.set(key, {
            data,
            expires: Date.now() + ttlSeconds * 1000,
          });
        }
      }
      res.setHeader("X-Cache", "MISS");
      return originalJson(data);
    };

    next();
  };
}

export function invalidateCache(pattern?: string) {
  if (!pattern) {
    cache.clear();
    return;
  }

  for (const key of cache.keys()) {
    if (key.startsWith(pattern)) {
      cache.delete(key);
    }
  }
}
