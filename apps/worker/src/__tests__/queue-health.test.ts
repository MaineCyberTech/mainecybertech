import { jest } from "@jest/globals";

jest.mock("../env", () => ({
  env: { QUEUE_BACKEND: "bullmq" },
}));
jest.mock("../producer", () => ({
  getTaskQueueHealth: jest.fn(),
}));
jest.mock("../queue-state", () => ({
  getConsumerConnection: jest.fn(),
}));

import { env } from "../env";
import { getTaskQueueHealth } from "../producer";
import { getConsumerConnection } from "../queue-state";
import { getWorkerQueueHealth, getWorkerQueueBackend } from "../queue-health";

const mockedProducer = getTaskQueueHealth as jest.MockedFunction<typeof getTaskQueueHealth>;
const mockedConsumer = getConsumerConnection as jest.MockedFunction<typeof getConsumerConnection>;

describe("getWorkerQueueHealth (RES-P2-008)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    env.QUEUE_BACKEND = "bullmq";
  });

  it("is connected when BullMQ is not the active queue backend", () => {
    env.QUEUE_BACKEND = "sqs";

    expect(getWorkerQueueHealth()).toEqual({ connected: true });
    expect(mockedProducer).not.toHaveBeenCalled();
    expect(mockedConsumer).not.toHaveBeenCalled();
  });

  it("reports the producer error when the queue producer is disconnected", () => {
    mockedProducer.mockReturnValue({ connected: false, error: "Redis connection closed" });

    expect(getWorkerQueueHealth()).toEqual({ connected: false, error: "Redis connection closed" });
    expect(mockedConsumer).not.toHaveBeenCalled();
  });

  it("reports the consumer state when the producer is connected", () => {
    mockedProducer.mockReturnValue({ connected: true });
    mockedConsumer.mockReturnValue({ connected: false, error: "Redis connection not ready" });

    expect(getWorkerQueueHealth()).toEqual({
      connected: false,
      error: "Redis connection not ready",
    });
  });

  it("is connected only when producer and consumer are both connected", () => {
    mockedProducer.mockReturnValue({ connected: true });
    mockedConsumer.mockReturnValue({ connected: true });

    expect(getWorkerQueueHealth()).toEqual({ connected: true });
  });

  // ARCH-P2-004: the consumer half of the queue backend contract is exposed
  // for /health and /metrics parity with the API.
  it("reports the configured queue backend", () => {
    env.QUEUE_BACKEND = "bullmq";
    expect(getWorkerQueueBackend()).toBe("bullmq");
  });
});
