-- BILL-P2-001 / BILL-P2-005: mirror the subscription trial/interval/cancellation
-- lifecycle and give refunds and void invoices their own fields.
--
-- The Stripe mirror previously stored only plan/status/period on
-- `subscriptions` and a status on `payments`, so it could not answer "when
-- does the trial end", "does this cancel at period end", "what interval is
-- this billed on", "how many seats", "how much was refunded and when", or
-- "when was this invoice voided". The Stripe webhook, `POST /billing/sync`
-- and the worker `stripe-reconcile` write-back now populate these columns:
--   * webhook + sync upserts: interval, trial_start, trial_end,
--     cancel_at_period_end, canceled_at, quantity (BILL-P2-001/P2-005);
--   * charge.refunded + sync charge backfill: refund_amount_cents,
--     refunded_at (BILL-P2-001);
--   * invoice.voided + sync invoice upsert: voided_at (BILL-P2-005).
--
-- All columns are nullable (or defaulted) so the migration is safe on
-- existing rows: an un-synced mirror row simply has no lifecycle data yet.
begin;

alter table public.subscriptions
  add column if not exists interval text,
  add column if not exists trial_start timestamptz,
  add column if not exists trial_end timestamptz,
  add column if not exists cancel_at_period_end boolean not null default false,
  add column if not exists canceled_at timestamptz,
  add column if not exists quantity integer;

alter table public.invoices
  add column if not exists voided_at timestamptz;

alter table public.payments
  add column if not exists refund_amount_cents bigint,
  add column if not exists refunded_at timestamptz;

commit;
