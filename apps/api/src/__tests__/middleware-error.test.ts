import { jest } from "@jest/globals";
import express from "express";
import request from "supertest";
import multer from "multer";
import { errorHandler } from "../middleware/error";

jest.mock("../config/env", () => ({
  getEnv: jest.fn().mockReturnValue({
    NODE_ENV: "test",
    LOG_LEVEL: "silent",
    SENTRY_DSN: "",
  }),
}));

jest.mock("../lib/logger", () => ({
  logger: { warn: jest.fn(), info: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

/**
 * FILE-P3-006: multer limit errors are client errors. Previously an oversized
 * upload fell through to the generic handler and returned 500.
 */
describe("errorHandler — upload limits (FILE-P3-006)", () => {
  function createApp(error: Error) {
    const app = express();
    app.get("/boom", () => {
      throw error;
    });
    app.use(errorHandler);
    return app;
  }

  it("maps LIMIT_FILE_SIZE to 413 PAYLOAD_TOO_LARGE", async () => {
    const err = new multer.MulterError("LIMIT_FILE_SIZE", "file");
    const res = await request(createApp(err)).get("/boom");
    expect(res.status).toBe(413);
    expect(res.body.error.code).toBe("PAYLOAD_TOO_LARGE");
    expect(res.body.error.status).toBe(413);
  });

  it("maps other multer limit errors to 400 VALIDATION", async () => {
    const err = new multer.MulterError("LIMIT_UNEXPECTED_FILE", "file");
    const res = await request(createApp(err)).get("/boom");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION");
    expect(res.body.error.message).toContain("unexpected file");
  });

  it("still returns 500 for unexpected errors", async () => {
    const res = await request(createApp(new Error("boom"))).get("/boom");
    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe("INTERNAL_SERVER_ERROR");
  });
});
