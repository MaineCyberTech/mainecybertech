-- Allow generic inbound webhook deliveries to be logged.
--
-- `logWebhookDelivery` (apps/api/src/routes/webhooks.ts) records a
-- PII-safe summary for inbound Stripe/JSM/M365 webhooks that are not tied
-- to a `webhook_endpoints` row, but inserts `webhook_id: null`. The column
-- was `not null`, so every such insert threw before the idempotency key was
-- stored — meaning the delivery log was always empty and duplicate webhooks
-- could be reprocessed. Make the column nullable so the generic delivery
-- log (and its idempotency bookkeeping) works.
begin;

alter table public.webhook_deliveries
  alter column webhook_id drop not null;

commit;
