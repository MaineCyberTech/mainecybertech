-- 03_local_portal_extra_demo_seed.sql
-- Additional local demo data beyond attach_real_users + schema-aligned seed.
-- LOCAL / DEV ONLY.

begin;

insert into public.organization_domains (
  organization_id,
  domain,
  auto_approve
)
values
  ('11111111-1111-1111-1111-111111111111'::uuid, 'acme.example', false),
  ('22222222-2222-2222-2222-222222222222'::uuid, 'beta.example', false)
on conflict (domain) do update
set organization_id = excluded.organization_id,
    auto_approve = excluded.auto_approve;

insert into public.billing_customers (
  id, organization_id, stripe_customer_id, billing_email, default_payment_method, metadata
)
values
  ('59000000-0000-0000-0000-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'cus_seed_acme_001', 'billing@acme.example', 'pm_seed_acme_visa', jsonb_build_object('seeded', true, 'system', 'local-dev')),
  ('59000000-0000-0000-0000-000000000002'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'cus_seed_northwind_001', 'billing@beta.example', 'pm_seed_beta_visa', jsonb_build_object('seeded', true, 'system', 'local-dev'))
on conflict (organization_id) do update
set stripe_customer_id = excluded.stripe_customer_id,
    billing_email = excluded.billing_email,
    default_payment_method = excluded.default_payment_method,
    metadata = excluded.metadata,
    updated_at = now();

insert into public.subscriptions (
  id, organization_id, stripe_subscription_id, plan_name, status, current_period_start, current_period_end, amount_cents, currency, metadata
)
values
  ('59100000-0000-0000-0000-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'sub_seed_acme_001', 'Managed Security Premium', 'active', now() - interval '10 days', now() + interval '20 days', 249900, 'usd', jsonb_build_object('seeded', true)),
  ('59100000-0000-0000-0000-000000000002'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'sub_seed_northwind_001', 'Managed IT Standard', 'active', now() - interval '12 days', now() + interval '18 days', 149900, 'usd', jsonb_build_object('seeded', true))
on conflict (stripe_subscription_id) do update
set plan_name = excluded.plan_name,
    status = excluded.status,
    current_period_start = excluded.current_period_start,
    current_period_end = excluded.current_period_end,
    amount_cents = excluded.amount_cents,
    currency = excluded.currency,
    metadata = excluded.metadata,
    updated_at = now();

insert into public.invoices (
  id, organization_id, stripe_invoice_id, invoice_number, status, subtotal_cents, tax_cents, total_cents, currency, hosted_invoice_url, invoice_pdf_url, due_at, paid_at
)
values
  ('59200000-0000-0000-0000-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'in_seed_acme_001', 'MCT-ACME-1001', 'paid', 249900, 0, 249900, 'usd', 'https://example.invalid/invoices/acme-1001', 'https://example.invalid/invoices/acme-1001.pdf', now() - interval '20 days', now() - interval '15 days'),
  ('59200000-0000-0000-0000-000000000002'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'in_seed_beta_001', 'MCT-BETA-2001', 'open', 149900, 0, 149900, 'usd', 'https://example.invalid/invoices/beta-2001', 'https://example.invalid/invoices/beta-2001.pdf', now() + interval '10 days', null)
on conflict (stripe_invoice_id) do update
set invoice_number = excluded.invoice_number,
    status = excluded.status,
    subtotal_cents = excluded.subtotal_cents,
    tax_cents = excluded.tax_cents,
    total_cents = excluded.total_cents,
    currency = excluded.currency,
    hosted_invoice_url = excluded.hosted_invoice_url,
    invoice_pdf_url = excluded.invoice_pdf_url,
    due_at = excluded.due_at,
    paid_at = excluded.paid_at,
    updated_at = now();

insert into public.payments (
  id, organization_id, invoice_id, stripe_payment_intent_id, amount_cents, currency, status, paid_at
)
values
  ('59300000-0000-0000-0000-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, '59200000-0000-0000-0000-000000000001'::uuid, 'pi_seed_acme_001', 249900, 'usd', 'succeeded', now() - interval '15 days')
on conflict (stripe_payment_intent_id) do update
set invoice_id = excluded.invoice_id,
    amount_cents = excluded.amount_cents,
    currency = excluded.currency,
    status = excluded.status,
    paid_at = excluded.paid_at;

-- Comments/appointments/chat tables removed in migration 5302055

commit;
