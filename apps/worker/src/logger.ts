import pino from "pino";
import { env } from "./env";

export const logger = pino({
  level: env.LOG_LEVEL,
  redact: {
    paths: [
      "password",
      "*.password",
      "secret",
      "*.secret",
      "token",
      "*.token",
      "authorization",
      "*.authorization",
      "cookie",
      "*.cookie",
      "email",
      "phone",
      "fullName",
      "full_name",
      "*.email",
      "*.phone",
      "to",
      "*.to",
      "emails",
      "*.emails",
      "recipient",
      "*.recipient",
      "recipients",
      "*.recipients",
      "req.headers.authorization",
      "req.headers.cookie",
    ],
    censor: "[REDACTED]",
  },
  transport:
    env.NODE_ENV !== "production"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            singleLine: false,
            translateTime: "SYS:standard",
          },
        }
      : undefined,
});
