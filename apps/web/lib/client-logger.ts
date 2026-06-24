"use client";

const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  silent: 4,
} as const;

type LogLevel = keyof typeof LOG_LEVELS;

const CURRENT_LEVEL = (process.env.NEXT_PUBLIC_LOG_LEVEL as LogLevel) || "info";
const CURRENT_LEVEL_NUM = LOG_LEVELS[CURRENT_LEVEL];

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= CURRENT_LEVEL_NUM;
}

function formatArgs(args: unknown[]): unknown[] {
  return args.map((arg) => {
    if (arg instanceof Error) {
      return {
        name: arg.name,
        message: arg.message,
        stack: arg.stack,
        cause: arg.cause,
      };
    }
    if (typeof arg === "object" && arg !== null) {
      try {
        return JSON.parse(JSON.stringify(arg));
      } catch {
        return String(arg);
      }
    }
    return arg;
  });
}

function logWithLevel(
  level: LogLevel,
  message: string,
  ...args: unknown[]
): void {
  if (!shouldLog(level)) return;

  const timestamp = new Date().toISOString();
  const formattedArgs = formatArgs([message, ...args]);
  const logEntry = {
    timestamp,
    level: level.toUpperCase(),
    message: formattedArgs[0],
    ...(formattedArgs.length > 1 ? { args: formattedArgs.slice(1) } : {}),
  };

  if (process.env.NODE_ENV !== "production") {
    const styles: Record<string, string> = {
      debug: "color: #64748b",
      info: "color: #06b6d4",
      warn: "color: #f59e0b",
      error: "color: #ef4444",
    };
    const consoleMethod =
      level === "debug" ? "log" : level === "silent" ? "log" : level;
    console[consoleMethod](
      `%c${timestamp} [${level.toUpperCase()}]`,
      styles[level],
      message,
      ...args.slice(1),
    );
  }

  if (typeof window !== "undefined" && (window as any).__LOG_ENDPOINT__) {
    fetch((window as any).__LOG_ENDPOINT__, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(logEntry),
      keepalive: true,
    }).catch(() => {});
  }
}

export const clientLogger = {
  debug: (message: string, ...args: unknown[]) =>
    logWithLevel("debug", message, ...args),
  info: (message: string, ...args: unknown[]) =>
    logWithLevel("info", message, ...args),
  warn: (message: string, ...args: unknown[]) =>
    logWithLevel("warn", message, ...args),
  error: (message: string, ...args: unknown[]) =>
    logWithLevel("error", message, ...args),

  errorWithContext: (context: Record<string, unknown>, error: Error) => {
    logWithLevel("error", error.message, { ...context, stack: error.stack });
  },
};
