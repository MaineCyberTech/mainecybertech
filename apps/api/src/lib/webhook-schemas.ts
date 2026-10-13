import { z } from "zod";

/**
 * WH-P2-006: minimal per-provider inbound webhook payload schemas.
 *
 * These are deliberately shallow shape checks, not full provider contracts:
 * they reject non-objects and payloads whose provider-identifying fields have
 * the wrong type, so a malformed request fails fast (400) instead of reaching
 * handler logic or the HMAC/clientState path. Unknown fields are preserved
 * (`.passthrough()`) because providers evolve their payloads independently and
 * the handlers only read the fields they need.
 */

/** Stripe event objects always carry an event id and type. */
export const stripeWebhookSchema = z
  .object({
    id: z.string().min(1),
    type: z.string().min(1),
  })
  .passthrough();

/** Jira and JSM payloads share the issue/webhookEvent shape. */
export const jiraWebhookSchema = z
  .object({
    webhookEvent: z.string().optional(),
    issue: z
      .object({
        key: z.string().optional(),
        fields: z
          .object({
            status: z.object({ name: z.string().optional() }).passthrough().optional(),
            summary: z.string().optional(),
          })
          .passthrough()
          .optional(),
      })
      .passthrough()
      .optional(),
    timestamp: z.union([z.string(), z.number()]).optional(),
  })
  .passthrough();

export const jsmWebhookSchema = jiraWebhookSchema;

/** Microsoft Graph change notifications arrive in a non-empty `value` array. */
export const m365WebhookSchema = z
  .object({
    value: z
      .array(
        z
          .object({
            clientState: z.string().optional(),
            resource: z.string().optional(),
            changeType: z.string().optional(),
            subscriptionExpirationDateTime: z.string().optional(),
          })
          .passthrough(),
      )
      .min(1),
  })
  .passthrough();
