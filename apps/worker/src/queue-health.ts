import { env } from "./env";
import { getTaskQueueHealth } from "./producer";
import { getConsumerConnection } from "./queue-state";

/**
 * Combined queue health for the worker process (RES-P2-008).
 *
 * The producer (Queue) and consumer (Worker) use separate BullMQ connections;
 * either being down means queued work stops flowing, so both must be connected
 * for the worker to be queue-healthy. When BullMQ is not the active queue
 * backend there is nothing to connect to.
 */
export function getWorkerQueueHealth(): { connected: boolean; error?: string } {
  if (env.QUEUE_BACKEND !== "bullmq") return { connected: true };

  const producer = getTaskQueueHealth();
  if (!producer.connected) return producer;

  return getConsumerConnection();
}
