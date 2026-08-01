import pino from "pino";
import { getEnv } from "../config/env";

const env = getEnv();

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
      "req.headers.authorization",
      "req.headers.cookie",
      "email",
      "phone",
      "fullName",
      "full_name",
      "req.body.email",
      "req.body.phone",
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
    ],
    censor: "[REDACTED]",
  },
  transport:
    env.NODE_ENV === "development"
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
