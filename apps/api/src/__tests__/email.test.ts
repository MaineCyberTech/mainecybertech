import { jest } from "@jest/globals";

const mockSendMail = jest.fn(async () => ({}));

jest.mock("nodemailer", () => ({
  __esModule: true,
  default: { createTransport: jest.fn(() => ({ sendMail: mockSendMail })) },
}));

const baseEnv = {
  NODE_ENV: "test",
  SMTP_HOST: "smtp.test.local",
  SMTP_PORT: 587,
  SMTP_USER: "smtp-user",
  SMTP_PASS: "smtp-pass",
  EMAIL_FROM: "noreply@test.local",
  LOG_LEVEL: "silent",
};

jest.mock("../config/env", () => ({
  getEnv: jest.fn().mockReturnValue({
    NODE_ENV: "test",
    SMTP_HOST: "smtp.test.local",
    SMTP_PORT: 587,
    SMTP_USER: "smtp-user",
    SMTP_PASS: "smtp-pass",
    EMAIL_FROM: "noreply@test.local",
    LOG_LEVEL: "silent",
  }),
}));

jest.mock("../lib/metrics", () => ({ recordNotificationDelivery: jest.fn() }));

import { sendEmail } from "../lib/email";
import { getEnv } from "../config/env";
import { recordNotificationDelivery } from "../lib/metrics";

describe("sendEmail inline retry (NOTIF-P2-006)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSendMail.mockReset();
    (getEnv as jest.Mock).mockReturnValue({ ...baseEnv });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("sends on the first attempt and reports success", async () => {
    mockSendMail.mockResolvedValueOnce({});

    await expect(sendEmail({ to: "user@example.com", subject: "Hi", text: "Body" })).resolves.toBe(
      true,
    );
    expect(mockSendMail).toHaveBeenCalledTimes(1);
  });

  it("retries transient failures and succeeds on a later attempt", async () => {
    jest.useFakeTimers();
    mockSendMail
      .mockRejectedValueOnce(new Error("greylisted"))
      .mockRejectedValueOnce(new Error("greylisted"))
      .mockResolvedValueOnce({});

    const promise = sendEmail({ to: "user@example.com", subject: "Hi", text: "Body" });
    await jest.runAllTimersAsync();

    await expect(promise).resolves.toBe(true);
    expect(mockSendMail).toHaveBeenCalledTimes(3);
  });

  it("returns false after exhausting the bounded attempts", async () => {
    jest.useFakeTimers();
    mockSendMail.mockRejectedValue(new Error("smtp down"));

    const promise = sendEmail({ to: "user@example.com", subject: "Hi", text: "Body" });
    await jest.runAllTimersAsync();

    await expect(promise).resolves.toBe(false);
    expect(mockSendMail).toHaveBeenCalledTimes(3);
  });

  it("skips without a transport when SMTP is not configured", async () => {
    (getEnv as jest.Mock).mockReturnValueOnce({ ...baseEnv, SMTP_HOST: "" });

    await expect(sendEmail({ to: "user@example.com", subject: "Hi" })).resolves.toBe(false);
    expect(mockSendMail).not.toHaveBeenCalled();
    expect(recordNotificationDelivery).toHaveBeenCalledWith("email", "skipped");
  });
});
