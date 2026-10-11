/**
 * Shared BullMQ consumer connection state (RES-P2-008).
 *
 * Deliberately dependency-free: the worker health server and the metrics
 * registry read this state, and importing the consumer module (which pulls in
 * the task registry and therefore the metrics registry) from either path would
 * add a require cycle. The consumer reports connection lifecycle events here;
 * readers only look at the last report.
 */

let connected = false;
let error: string | undefined;

/** Record the BullMQ consumer connection state (called from consumer-bullmq.ts). */
export function reportConsumerConnection(nextConnected: boolean, nextError?: string): void {
  connected = nextConnected;
  error = nextConnected ? undefined : (nextError ?? "Redis connection not ready");
}

/** Last known BullMQ consumer connection state. */
export function getConsumerConnection(): { connected: boolean; error?: string } {
  return connected ? { connected: true } : { connected: false, error };
}
