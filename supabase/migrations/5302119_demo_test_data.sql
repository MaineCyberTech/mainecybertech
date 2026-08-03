-- =========================================================
-- 5302119: Demo/test data for the dev environment
--
-- Mirrors supabase/seeds/05_comprehensive_test_data.sql so the
-- demo organizations, users, and cross-module rows are also
-- present in HOSTED databases (seeds only run for local reset
-- and E2E; migrations run everywhere via supabase db push).
--
-- SAFETY GUARD: the whole block is skipped when the database
-- already contains production-like tenants (any organization
-- with a real domain, i.e. not *.example / *.local). Demo
-- accounts all use the password: 1 (dev only).
-- =========================================================

do $$
begin
  if exists (
    select 1 from public.organizations
    where primary_domain is not null
      and primary_domain not like '%.example'
      and primary_domain not like '%.local'
  ) then
    raise notice '5302119: production-like organization domains detected - skipping demo data';
    return;
  end if;

-- =========================================================
-- 1. NEW ORGANIZATIONS
-- =========================================================
insert into public.organizations (
  id, name, slug, status, primary_domain, support_plan, brand_color, accent_color, settings
)
values
  ('11111111-1111-1111-1111-111111111111'::uuid, 'Acme Manufacturing', 'acme', 'approved'::public.org_status, 'acme.example', 'Managed Security Premium', '#059669', '#0D9488', jsonb_build_object('seeded', true, 'industry', 'manufacturing')),
  ('22222222-2222-2222-2222-222222222222'::uuid, 'Northwind Legal', 'northwind', 'approved'::public.org_status, 'beta.example', 'Managed IT Standard', '#2563EB', '#7C3AED', jsonb_build_object('seeded', true, 'industry', 'legal')),
  ('33333333-3333-4333-8333-333333333333'::uuid, 'Harborview Health Systems', 'harborview', 'approved'::public.org_status, 'harborview.example', 'Managed Security Premium', '#0EA5E9', '#6366F1', jsonb_build_object('seeded', true, 'industry', 'healthcare')),
  ('44444444-4444-4444-8444-444444444444'::uuid, 'Brightline Retail Group', 'brightline', 'approved'::public.org_status, 'brightline.example', 'Managed IT Standard', '#F59E0B', '#EF4444', jsonb_build_object('seeded', true, 'industry', 'retail')),
  ('55555555-5555-4555-8555-555555555555'::uuid, 'Summit Financial Advisors', 'summit', 'approved'::public.org_status, 'summit.example', 'Managed Security Premium', '#8B5CF6', '#EC4899', jsonb_build_object('seeded', true, 'industry', 'finance'))
on conflict (id) do update
set
  name = excluded.name,
  slug = excluded.slug,
  status = excluded.status,
  primary_domain = excluded.primary_domain,
  support_plan = excluded.support_plan,
  brand_color = excluded.brand_color,
  accent_color = excluded.accent_color,
  settings = excluded.settings,
  updated_at = now();

-- =========================================================
-- 2. ORGANIZATION DOMAINS
-- =========================================================
insert into public.organization_domains (organization_id, domain, auto_approve)
values
  ('11111111-1111-1111-1111-111111111111'::uuid, 'acme.example', false),
  ('22222222-2222-2222-2222-222222222222'::uuid, 'beta.example', false),
  ('33333333-3333-4333-8333-333333333333'::uuid, 'harborview.example', false),
  ('44444444-4444-4444-8444-444444444444'::uuid, 'brightline.example', false),
  ('55555555-5555-4555-8555-555555555555'::uuid, 'summit.example', false)
on conflict (domain) do update
set organization_id = excluded.organization_id,
    auto_approve = excluded.auto_approve;

-- =========================================================
-- 3. BILLING (customers, subscriptions, invoices, payments)
-- =========================================================
insert into public.billing_customers (
  id, organization_id, stripe_customer_id, billing_email, default_payment_method, metadata
)
values
  ('59400000-0000-0000-0000-000000000001'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'cus_seed_harborview_001', 'billing@harborview.example', 'pm_seed_harborview_visa', jsonb_build_object('seeded', true, 'system', 'local-dev')),
  ('59400000-0000-0000-0000-000000000002'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'cus_seed_brightline_001', 'billing@brightline.example', 'pm_seed_brightline_visa', jsonb_build_object('seeded', true, 'system', 'local-dev')),
  ('59400000-0000-0000-0000-000000000003'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'cus_seed_summit_001', 'billing@summit.example', 'pm_seed_summit_visa', jsonb_build_object('seeded', true, 'system', 'local-dev'))
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
  ('59410000-0000-0000-0000-000000000001'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'sub_seed_harborview_001', 'Managed Security Premium', 'active', now() - interval '9 days', now() + interval '21 days', 299900, 'usd', jsonb_build_object('seeded', true)),
  ('59410000-0000-0000-0000-000000000002'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'sub_seed_brightline_001', 'Managed IT Standard', 'active', now() - interval '14 days', now() + interval '16 days', 189900, 'usd', jsonb_build_object('seeded', true)),
  ('59410000-0000-0000-0000-000000000003'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'sub_seed_summit_001', 'Managed Security Premium', 'past_due', now() - interval '25 days', now() + interval '5 days', 349900, 'usd', jsonb_build_object('seeded', true))
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
  ('59420000-0000-0000-0000-000000000001'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'in_seed_harborview_001', 'MCT-HARBOR-3001', 'paid', 299900, 0, 299900, 'usd', 'https://example.invalid/invoices/harborview-3001', 'https://example.invalid/invoices/harborview-3001.pdf', now() - interval '9 days', now() - interval '4 days'),
  ('59420000-0000-0000-0000-000000000002'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'in_seed_brightline_001', 'MCT-BRIGHT-4001', 'open', 189900, 0, 189900, 'usd', 'https://example.invalid/invoices/brightline-4001', 'https://example.invalid/invoices/brightline-4001.pdf', now() + interval '8 days', null),
  ('59420000-0000-0000-0000-000000000003'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'in_seed_summit_001', 'MCT-SUMMIT-5001', 'open', 349900, 0, 349900, 'usd', 'https://example.invalid/invoices/summit-5001', 'https://example.invalid/invoices/summit-5001.pdf', now() - interval '3 days', null)
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
  ('59430000-0000-0000-0000-000000000001'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, '59420000-0000-0000-0000-000000000001'::uuid, 'pi_seed_harborview_001', 299900, 'usd', 'succeeded', now() - interval '4 days')
on conflict (stripe_payment_intent_id) do update
set invoice_id = excluded.invoice_id,
    amount_cents = excluded.amount_cents,
    currency = excluded.currency,
    status = excluded.status,
    paid_at = excluded.paid_at;

-- =========================================================
-- 4. AUTH USERS (20 new accounts, password: 1)
-- =========================================================
delete from auth.identities
where user_id in (
  'a1000000-0000-4000-8000-000000000001','a1000000-0000-4000-8000-000000000002',
  'a1000000-0000-4000-8000-000000000003','a1000000-0000-4000-8000-000000000004',
  'a1000000-0000-4000-8000-000000000005','b2000000-0000-4000-8000-000000000001',
  'b2000000-0000-4000-8000-000000000002','b2000000-0000-4000-8000-000000000003',
  'b2000000-0000-4000-8000-000000000004','b2000000-0000-4000-8000-000000000005',
  'c3000000-0000-4000-8000-000000000001','c3000000-0000-4000-8000-000000000002',
  'c3000000-0000-4000-8000-000000000003','c3000000-0000-4000-8000-000000000004',
  'c3000000-0000-4000-8000-000000000005','d4000000-0000-4000-8000-000000000001',
  'd4000000-0000-4000-8000-000000000002','d4000000-0000-4000-8000-000000000003',
  'd4000000-0000-4000-8000-000000000004','d4000000-0000-4000-8000-000000000005'
)
   or provider_id in (
  'a1000000-0000-4000-8000-000000000001','a1000000-0000-4000-8000-000000000002',
  'a1000000-0000-4000-8000-000000000003','a1000000-0000-4000-8000-000000000004',
  'a1000000-0000-4000-8000-000000000005','b2000000-0000-4000-8000-000000000001',
  'b2000000-0000-4000-8000-000000000002','b2000000-0000-4000-8000-000000000003',
  'b2000000-0000-4000-8000-000000000004','b2000000-0000-4000-8000-000000000005',
  'c3000000-0000-4000-8000-000000000001','c3000000-0000-4000-8000-000000000002',
  'c3000000-0000-4000-8000-000000000003','c3000000-0000-4000-8000-000000000004',
  'c3000000-0000-4000-8000-000000000005','d4000000-0000-4000-8000-000000000001',
  'd4000000-0000-4000-8000-000000000002','d4000000-0000-4000-8000-000000000003',
  'd4000000-0000-4000-8000-000000000004','d4000000-0000-4000-8000-000000000005'
)
   or id in (
  'a1000000-0000-4000-8000-000000000001','a1000000-0000-4000-8000-000000000002',
  'a1000000-0000-4000-8000-000000000003','a1000000-0000-4000-8000-000000000004',
  'a1000000-0000-4000-8000-000000000005','b2000000-0000-4000-8000-000000000001',
  'b2000000-0000-4000-8000-000000000002','b2000000-0000-4000-8000-000000000003',
  'b2000000-0000-4000-8000-000000000004','b2000000-0000-4000-8000-000000000005',
  'c3000000-0000-4000-8000-000000000001','c3000000-0000-4000-8000-000000000002',
  'c3000000-0000-4000-8000-000000000003','c3000000-0000-4000-8000-000000000004',
  'c3000000-0000-4000-8000-000000000005','d4000000-0000-4000-8000-000000000001',
  'd4000000-0000-4000-8000-000000000002','d4000000-0000-4000-8000-000000000003',
  'd4000000-0000-4000-8000-000000000004','d4000000-0000-4000-8000-000000000005'
);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, invited_at,
  confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at,
  email_change_token_new, email_change, email_change_sent_at, last_sign_in_at,
  raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at,
  phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at,
  email_change_token_current, email_change_confirm_status, banned_until,
  reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at, is_anonymous
)
values
  -- Harborview Health Systems
  ('00000000-0000-0000-0000-000000000000', 'a1000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'hannah.reyes@harborview.example', '$2a$10$WBaKteRHgBxhGdSfULyK0eqwF2ccw0JygnROECp.fFpypkkkTV1NC', '2026-08-01 08:00:00+00', NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}'::jsonb, '{"email_verified": true}'::jsonb, NULL, '2026-08-01 08:00:00+00', '2026-08-01 08:00:00+00', '555-0301', NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
  ('00000000-0000-0000-0000-000000000000', 'a1000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'marcus.chen@harborview.example', '$2a$10$WBaKteRHgBxhGdSfULyK0eqwF2ccw0JygnROECp.fFpypkkkTV1NC', '2026-08-01 08:05:00+00', NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}'::jsonb, '{"email_verified": true}'::jsonb, NULL, '2026-08-01 08:05:00+00', '2026-08-01 08:05:00+00', '555-0302', NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
  ('00000000-0000-0000-0000-000000000000', 'a1000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'priya.sharma@harborview.example', '$2a$10$WBaKteRHgBxhGdSfULyK0eqwF2ccw0JygnROECp.fFpypkkkTV1NC', '2026-08-01 08:10:00+00', NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}'::jsonb, '{"email_verified": true}'::jsonb, NULL, '2026-08-01 08:10:00+00', '2026-08-01 08:10:00+00', '555-0303', NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
  ('00000000-0000-0000-0000-000000000000', 'a1000000-0000-4000-8000-000000000004', 'authenticated', 'authenticated', 'tom.nguyen@harborview.example', '$2a$10$WBaKteRHgBxhGdSfULyK0eqwF2ccw0JygnROECp.fFpypkkkTV1NC', '2026-08-01 08:15:00+00', NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}'::jsonb, '{"email_verified": true}'::jsonb, NULL, '2026-08-01 08:15:00+00', '2026-08-01 08:15:00+00', '555-0304', NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
  ('00000000-0000-0000-0000-000000000000', 'a1000000-0000-4000-8000-000000000005', 'authenticated', 'authenticated', 'fatima.al-rashid@harborview.example', '$2a$10$WBaKteRHgBxhGdSfULyK0eqwF2ccw0JygnROECp.fFpypkkkTV1NC', '2026-08-01 08:20:00+00', NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}'::jsonb, '{"email_verified": true}'::jsonb, NULL, '2026-08-01 08:20:00+00', '2026-08-01 08:20:00+00', '555-0305', NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
  -- Brightline Retail Group
  ('00000000-0000-0000-0000-000000000000', 'b2000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'sarah.patel@brightline.example', '$2a$10$WBaKteRHgBxhGdSfULyK0eqwF2ccw0JygnROECp.fFpypkkkTV1NC', '2026-08-01 09:00:00+00', NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}'::jsonb, '{"email_verified": true}'::jsonb, NULL, '2026-08-01 09:00:00+00', '2026-08-01 09:00:00+00', '555-0401', NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
  ('00000000-0000-0000-0000-000000000000', 'b2000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'tyler.brooks@brightline.example', '$2a$10$WBaKteRHgBxhGdSfULyK0eqwF2ccw0JygnROECp.fFpypkkkTV1NC', '2026-08-01 09:05:00+00', NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}'::jsonb, '{"email_verified": true}'::jsonb, NULL, '2026-08-01 09:05:00+00', '2026-08-01 09:05:00+00', '555-0402', NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
  ('00000000-0000-0000-0000-000000000000', 'b2000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'mei.lin@brightline.example', '$2a$10$WBaKteRHgBxhGdSfULyK0eqwF2ccw0JygnROECp.fFpypkkkTV1NC', '2026-08-01 09:10:00+00', NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}'::jsonb, '{"email_verified": true}'::jsonb, NULL, '2026-08-01 09:10:00+00', '2026-08-01 09:10:00+00', '555-0403', NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
  ('00000000-0000-0000-0000-000000000000', 'b2000000-0000-4000-8000-000000000004', 'authenticated', 'authenticated', 'liam.obrien@brightline.example', '$2a$10$WBaKteRHgBxhGdSfULyK0eqwF2ccw0JygnROECp.fFpypkkkTV1NC', '2026-08-01 09:15:00+00', NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}'::jsonb, '{"email_verified": true}'::jsonb, NULL, '2026-08-01 09:15:00+00', '2026-08-01 09:15:00+00', '555-0404', NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
  ('00000000-0000-0000-0000-000000000000', 'b2000000-0000-4000-8000-000000000005', 'authenticated', 'authenticated', 'jamal.williams@brightline.example', '$2a$10$WBaKteRHgBxhGdSfULyK0eqwF2ccw0JygnROECp.fFpypkkkTV1NC', '2026-08-01 09:20:00+00', NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}'::jsonb, '{"email_verified": true}'::jsonb, NULL, '2026-08-01 09:20:00+00', '2026-08-01 09:20:00+00', '555-0405', NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
  -- Summit Financial Advisors
  ('00000000-0000-0000-0000-000000000000', 'c3000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'elena.volkov@summit.example', '$2a$10$WBaKteRHgBxhGdSfULyK0eqwF2ccw0JygnROECp.fFpypkkkTV1NC', '2026-08-01 10:00:00+00', NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}'::jsonb, '{"email_verified": true}'::jsonb, NULL, '2026-08-01 10:00:00+00', '2026-08-01 10:00:00+00', '555-0501', NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
  ('00000000-0000-0000-0000-000000000000', 'c3000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'raj.gupta@summit.example', '$2a$10$WBaKteRHgBxhGdSfULyK0eqwF2ccw0JygnROECp.fFpypkkkTV1NC', '2026-08-01 10:05:00+00', NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}'::jsonb, '{"email_verified": true}'::jsonb, NULL, '2026-08-01 10:05:00+00', '2026-08-01 10:05:00+00', '555-0502', NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
  ('00000000-0000-0000-0000-000000000000', 'c3000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'sofia.rodriguez@summit.example', '$2a$10$WBaKteRHgBxhGdSfULyK0eqwF2ccw0JygnROECp.fFpypkkkTV1NC', '2026-08-01 10:10:00+00', NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}'::jsonb, '{"email_verified": true}'::jsonb, NULL, '2026-08-01 10:10:00+00', '2026-08-01 10:10:00+00', '555-0503', NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
  ('00000000-0000-0000-0000-000000000000', 'c3000000-0000-4000-8000-000000000004', 'authenticated', 'authenticated', 'chen.wei@summit.example', '$2a$10$WBaKteRHgBxhGdSfULyK0eqwF2ccw0JygnROECp.fFpypkkkTV1NC', '2026-08-01 10:15:00+00', NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}'::jsonb, '{"email_verified": true}'::jsonb, NULL, '2026-08-01 10:15:00+00', '2026-08-01 10:15:00+00', '555-0504', NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
  ('00000000-0000-0000-0000-000000000000', 'c3000000-0000-4000-8000-000000000005', 'authenticated', 'authenticated', 'olivia.foster@summit.example', '$2a$10$WBaKteRHgBxhGdSfULyK0eqwF2ccw0JygnROECp.fFpypkkkTV1NC', '2026-08-01 10:20:00+00', NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}'::jsonb, '{"email_verified": true}'::jsonb, NULL, '2026-08-01 10:20:00+00', '2026-08-01 10:20:00+00', '555-0505', NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
  -- MSP internal (technicians + service manager)
  ('00000000-0000-0000-0000-000000000000', 'd4000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'jake.morrison@mainecybertech.local', '$2a$10$WBaKteRHgBxhGdSfULyK0eqwF2ccw0JygnROECp.fFpypkkkTV1NC', '2026-08-01 11:00:00+00', NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}'::jsonb, '{"email_verified": true}'::jsonb, NULL, '2026-08-01 11:00:00+00', '2026-08-01 11:00:00+00', '555-0601', NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
  ('00000000-0000-0000-0000-000000000000', 'd4000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'carlos.rivera@mainecybertech.local', '$2a$10$WBaKteRHgBxhGdSfULyK0eqwF2ccw0JygnROECp.fFpypkkkTV1NC', '2026-08-01 11:05:00+00', NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}'::jsonb, '{"email_verified": true}'::jsonb, NULL, '2026-08-01 11:05:00+00', '2026-08-01 11:05:00+00', '555-0602', NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
  ('00000000-0000-0000-0000-000000000000', 'd4000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'dmitri.petrov@mainecybertech.local', '$2a$10$WBaKteRHgBxhGdSfULyK0eqwF2ccw0JygnROECp.fFpypkkkTV1NC', '2026-08-01 11:10:00+00', NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}'::jsonb, '{"email_verified": true}'::jsonb, NULL, '2026-08-01 11:10:00+00', '2026-08-01 11:10:00+00', '555-0603', NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
  ('00000000-0000-0000-0000-000000000000', 'd4000000-0000-4000-8000-000000000004', 'authenticated', 'authenticated', 'aisha.johnson@mainecybertech.local', '$2a$10$WBaKteRHgBxhGdSfULyK0eqwF2ccw0JygnROECp.fFpypkkkTV1NC', '2026-08-01 11:15:00+00', NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}'::jsonb, '{"email_verified": true}'::jsonb, NULL, '2026-08-01 11:15:00+00', '2026-08-01 11:15:00+00', '555-0604', NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
  ('00000000-0000-0000-0000-000000000000', 'd4000000-0000-4000-8000-000000000005', 'authenticated', 'authenticated', 'nkechi.adeyemi@mainecybertech.local', '$2a$10$WBaKteRHgBxhGdSfULyK0eqwF2ccw0JygnROECp.fFpypkkkTV1NC', '2026-08-01 11:20:00+00', NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}'::jsonb, '{"email_verified": true}'::jsonb, NULL, '2026-08-01 11:20:00+00', '2026-08-01 11:20:00+00', '555-0605', NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false)
on conflict (id) do update
set
  aud = excluded.aud,
  role = excluded.role,
  email = excluded.email,
  encrypted_password = excluded.encrypted_password,
  email_confirmed_at = excluded.email_confirmed_at,
  last_sign_in_at = excluded.last_sign_in_at,
  raw_app_meta_data = excluded.raw_app_meta_data,
  raw_user_meta_data = excluded.raw_user_meta_data,
  updated_at = excluded.updated_at,
  phone = excluded.phone;

insert into auth.identities (
  id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
)
values
  ('a1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001', '{"sub": "a1000000-0000-4000-8000-000000000001", "email": "hannah.reyes@harborview.example", "email_verified": true}'::jsonb, 'email', 'a1000000-0000-4000-8000-000000000001', NULL, '2026-08-01 08:00:00+00', '2026-08-01 08:00:00+00'),
  ('a1000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000002', '{"sub": "a1000000-0000-4000-8000-000000000002", "email": "marcus.chen@harborview.example", "email_verified": true}'::jsonb, 'email', 'a1000000-0000-4000-8000-000000000002', NULL, '2026-08-01 08:05:00+00', '2026-08-01 08:05:00+00'),
  ('a1000000-0000-4000-8000-000000000003', 'a1000000-0000-4000-8000-000000000003', '{"sub": "a1000000-0000-4000-8000-000000000003", "email": "priya.sharma@harborview.example", "email_verified": true}'::jsonb, 'email', 'a1000000-0000-4000-8000-000000000003', NULL, '2026-08-01 08:10:00+00', '2026-08-01 08:10:00+00'),
  ('a1000000-0000-4000-8000-000000000004', 'a1000000-0000-4000-8000-000000000004', '{"sub": "a1000000-0000-4000-8000-000000000004", "email": "tom.nguyen@harborview.example", "email_verified": true}'::jsonb, 'email', 'a1000000-0000-4000-8000-000000000004', NULL, '2026-08-01 08:15:00+00', '2026-08-01 08:15:00+00'),
  ('a1000000-0000-4000-8000-000000000005', 'a1000000-0000-4000-8000-000000000005', '{"sub": "a1000000-0000-4000-8000-000000000005", "email": "fatima.al-rashid@harborview.example", "email_verified": true}'::jsonb, 'email', 'a1000000-0000-4000-8000-000000000005', NULL, '2026-08-01 08:20:00+00', '2026-08-01 08:20:00+00'),
  ('b2000000-0000-4000-8000-000000000001', 'b2000000-0000-4000-8000-000000000001', '{"sub": "b2000000-0000-4000-8000-000000000001", "email": "sarah.patel@brightline.example", "email_verified": true}'::jsonb, 'email', 'b2000000-0000-4000-8000-000000000001', NULL, '2026-08-01 09:00:00+00', '2026-08-01 09:00:00+00'),
  ('b2000000-0000-4000-8000-000000000002', 'b2000000-0000-4000-8000-000000000002', '{"sub": "b2000000-0000-4000-8000-000000000002", "email": "tyler.brooks@brightline.example", "email_verified": true}'::jsonb, 'email', 'b2000000-0000-4000-8000-000000000002', NULL, '2026-08-01 09:05:00+00', '2026-08-01 09:05:00+00'),
  ('b2000000-0000-4000-8000-000000000003', 'b2000000-0000-4000-8000-000000000003', '{"sub": "b2000000-0000-4000-8000-000000000003", "email": "mei.lin@brightline.example", "email_verified": true}'::jsonb, 'email', 'b2000000-0000-4000-8000-000000000003', NULL, '2026-08-01 09:10:00+00', '2026-08-01 09:10:00+00'),
  ('b2000000-0000-4000-8000-000000000004', 'b2000000-0000-4000-8000-000000000004', '{"sub": "b2000000-0000-4000-8000-000000000004", "email": "liam.obrien@brightline.example", "email_verified": true}'::jsonb, 'email', 'b2000000-0000-4000-8000-000000000004', NULL, '2026-08-01 09:15:00+00', '2026-08-01 09:15:00+00'),
  ('b2000000-0000-4000-8000-000000000005', 'b2000000-0000-4000-8000-000000000005', '{"sub": "b2000000-0000-4000-8000-000000000005", "email": "jamal.williams@brightline.example", "email_verified": true}'::jsonb, 'email', 'b2000000-0000-4000-8000-000000000005', NULL, '2026-08-01 09:20:00+00', '2026-08-01 09:20:00+00'),
  ('c3000000-0000-4000-8000-000000000001', 'c3000000-0000-4000-8000-000000000001', '{"sub": "c3000000-0000-4000-8000-000000000001", "email": "elena.volkov@summit.example", "email_verified": true}'::jsonb, 'email', 'c3000000-0000-4000-8000-000000000001', NULL, '2026-08-01 10:00:00+00', '2026-08-01 10:00:00+00'),
  ('c3000000-0000-4000-8000-000000000002', 'c3000000-0000-4000-8000-000000000002', '{"sub": "c3000000-0000-4000-8000-000000000002", "email": "raj.gupta@summit.example", "email_verified": true}'::jsonb, 'email', 'c3000000-0000-4000-8000-000000000002', NULL, '2026-08-01 10:05:00+00', '2026-08-01 10:05:00+00'),
  ('c3000000-0000-4000-8000-000000000003', 'c3000000-0000-4000-8000-000000000003', '{"sub": "c3000000-0000-4000-8000-000000000003", "email": "sofia.rodriguez@summit.example", "email_verified": true}'::jsonb, 'email', 'c3000000-0000-4000-8000-000000000003', NULL, '2026-08-01 10:10:00+00', '2026-08-01 10:10:00+00'),
  ('c3000000-0000-4000-8000-000000000004', 'c3000000-0000-4000-8000-000000000004', '{"sub": "c3000000-0000-4000-8000-000000000004", "email": "chen.wei@summit.example", "email_verified": true}'::jsonb, 'email', 'c3000000-0000-4000-8000-000000000004', NULL, '2026-08-01 10:15:00+00', '2026-08-01 10:15:00+00'),
  ('c3000000-0000-4000-8000-000000000005', 'c3000000-0000-4000-8000-000000000005', '{"sub": "c3000000-0000-4000-8000-000000000005", "email": "olivia.foster@summit.example", "email_verified": true}'::jsonb, 'email', 'c3000000-0000-4000-8000-000000000005', NULL, '2026-08-01 10:20:00+00', '2026-08-01 10:20:00+00'),
  ('d4000000-0000-4000-8000-000000000001', 'd4000000-0000-4000-8000-000000000001', '{"sub": "d4000000-0000-4000-8000-000000000001", "email": "jake.morrison@mainecybertech.local", "email_verified": true}'::jsonb, 'email', 'd4000000-0000-4000-8000-000000000001', NULL, '2026-08-01 11:00:00+00', '2026-08-01 11:00:00+00'),
  ('d4000000-0000-4000-8000-000000000002', 'd4000000-0000-4000-8000-000000000002', '{"sub": "d4000000-0000-4000-8000-000000000002", "email": "carlos.rivera@mainecybertech.local", "email_verified": true}'::jsonb, 'email', 'd4000000-0000-4000-8000-000000000002', NULL, '2026-08-01 11:05:00+00', '2026-08-01 11:05:00+00'),
  ('d4000000-0000-4000-8000-000000000003', 'd4000000-0000-4000-8000-000000000003', '{"sub": "d4000000-0000-4000-8000-000000000003", "email": "dmitri.petrov@mainecybertech.local", "email_verified": true}'::jsonb, 'email', 'd4000000-0000-4000-8000-000000000003', NULL, '2026-08-01 11:10:00+00', '2026-08-01 11:10:00+00'),
  ('d4000000-0000-4000-8000-000000000004', 'd4000000-0000-4000-8000-000000000004', '{"sub": "d4000000-0000-4000-8000-000000000004", "email": "aisha.johnson@mainecybertech.local", "email_verified": true}'::jsonb, 'email', 'd4000000-0000-4000-8000-000000000004', NULL, '2026-08-01 11:15:00+00', '2026-08-01 11:15:00+00'),
  ('d4000000-0000-4000-8000-000000000005', 'd4000000-0000-4000-8000-000000000005', '{"sub": "d4000000-0000-4000-8000-000000000005", "email": "nkechi.adeyemi@mainecybertech.local", "email_verified": true}'::jsonb, 'email', 'd4000000-0000-4000-8000-000000000005', NULL, '2026-08-01 11:20:00+00', '2026-08-01 11:20:00+00')
on conflict (id) do nothing;

-- =========================================================
-- 5. PROFILES
-- =========================================================
with user_rows(user_id, email, full_name, title, phone, default_org_id, is_super_admin, demo_label) as (
  values
    ('a1000000-0000-4000-8000-000000000001'::uuid, 'hannah.reyes@harborview.example', 'Dr. Hannah Reyes', 'IT Director', '555-0301', '33333333-3333-4333-8333-333333333333'::uuid, false, 'hannah@harborview.example'),
    ('a1000000-0000-4000-8000-000000000002'::uuid, 'marcus.chen@harborview.example', 'Marcus Chen', 'Network Administrator', '555-0302', '33333333-3333-4333-8333-333333333333'::uuid, false, 'marcus@harborview.example'),
    ('a1000000-0000-4000-8000-000000000003'::uuid, 'priya.sharma@harborview.example', 'Priya Sharma', 'Compliance Officer', '555-0303', '33333333-3333-4333-8333-333333333333'::uuid, false, 'priya@harborview.example'),
    ('a1000000-0000-4000-8000-000000000004'::uuid, 'tom.nguyen@harborview.example', 'Tom Nguyen', 'Systems Analyst', '555-0304', '33333333-3333-4333-8333-333333333333'::uuid, false, 'tom@harborview.example'),
    ('a1000000-0000-4000-8000-000000000005'::uuid, 'fatima.al-rashid@harborview.example', 'Fatima Al-Rashid', 'Security Analyst', '555-0305', '33333333-3333-4333-8333-333333333333'::uuid, false, 'fatima@harborview.example'),
    ('b2000000-0000-4000-8000-000000000001'::uuid, 'sarah.patel@brightline.example', 'Sarah Patel', 'VP of IT', '555-0401', '44444444-4444-4444-8444-444444444444'::uuid, false, 'sarah@brightline.example'),
    ('b2000000-0000-4000-8000-000000000002'::uuid, 'tyler.brooks@brightline.example', 'Tyler Brooks', 'Store Systems Lead', '555-0402', '44444444-4444-4444-8444-444444444444'::uuid, false, 'tyler@brightline.example'),
    ('b2000000-0000-4000-8000-000000000003'::uuid, 'mei.lin@brightline.example', 'Mei Lin', 'Data Analyst', '555-0403', '44444444-4444-4444-8444-444444444444'::uuid, false, 'mei@brightline.example'),
    ('b2000000-0000-4000-8000-000000000004'::uuid, 'liam.obrien@brightline.example', 'Liam O''Brien', 'POS Support Engineer', '555-0404', '44444444-4444-4444-8444-444444444444'::uuid, false, 'liam@brightline.example'),
    ('b2000000-0000-4000-8000-000000000005'::uuid, 'jamal.williams@brightline.example', 'Jamal Williams', 'Field Technician', '555-0405', '44444444-4444-4444-8444-444444444444'::uuid, false, 'jamal@brightline.example'),
    ('c3000000-0000-4000-8000-000000000001'::uuid, 'elena.volkov@summit.example', 'Elena Volkov', 'Managing Director', '555-0501', '55555555-5555-4555-8555-555555555555'::uuid, false, 'elena@summit.example'),
    ('c3000000-0000-4000-8000-000000000002'::uuid, 'raj.gupta@summit.example', 'Raj Gupta', 'Wealth Manager', '555-0502', '55555555-5555-4555-8555-555555555555'::uuid, false, 'raj@summit.example'),
    ('c3000000-0000-4000-8000-000000000003'::uuid, 'sofia.rodriguez@summit.example', 'Sofia Rodriguez', 'Operations Manager', '555-0503', '55555555-5555-4555-8555-555555555555'::uuid, false, 'sofia@summit.example'),
    ('c3000000-0000-4000-8000-000000000004'::uuid, 'chen.wei@summit.example', 'Chen Wei', 'Security Analyst', '555-0504', '55555555-5555-4555-8555-555555555555'::uuid, false, 'chen@summit.example'),
    ('c3000000-0000-4000-8000-000000000005'::uuid, 'olivia.foster@summit.example', 'Olivia Foster', 'Compliance Analyst', '555-0505', '55555555-5555-4555-8555-555555555555'::uuid, false, 'olivia@summit.example'),
    ('d4000000-0000-4000-8000-000000000001'::uuid, 'jake.morrison@mainecybertech.local', 'Jake Morrison', 'Senior Technician', '555-0601', '11111111-1111-1111-1111-111111111111'::uuid, false, 'jake@mainecybertech.local'),
    ('d4000000-0000-4000-8000-000000000002'::uuid, 'carlos.rivera@mainecybertech.local', 'Carlos Rivera', 'NOC Engineer', '555-0602', '22222222-2222-2222-2222-222222222222'::uuid, false, 'carlos@mainecybertech.local'),
    ('d4000000-0000-4000-8000-000000000003'::uuid, 'dmitri.petrov@mainecybertech.local', 'Dmitri Petrov', 'Security Engineer', '555-0603', '11111111-1111-1111-1111-111111111111'::uuid, false, 'dmitri@mainecybertech.local'),
    ('d4000000-0000-4000-8000-000000000004'::uuid, 'aisha.johnson@mainecybertech.local', 'Aisha Johnson', 'Service Manager', '555-0604', '11111111-1111-1111-1111-111111111111'::uuid, false, 'aisha@mainecybertech.local'),
    ('d4000000-0000-4000-8000-000000000005'::uuid, 'nkechi.adeyemi@mainecybertech.local', 'Nkechi Adeyemi', 'Client Success Manager', '555-0605', '22222222-2222-2222-2222-222222222222'::uuid, false, 'nkechi@mainecybertech.local')
)
insert into public.profiles (
  id, email, full_name, phone, title, is_super_admin, default_organization_id, metadata
)
select
  u.user_id, u.email, u.full_name, u.phone, u.title, u.is_super_admin, u.default_org_id,
  jsonb_build_object('seeded', true, 'demo_label', u.demo_label)
from user_rows u
on conflict (id) do update
set
  email = excluded.email,
  full_name = excluded.full_name,
  phone = excluded.phone,
  title = excluded.title,
  is_super_admin = excluded.is_super_admin,
  default_organization_id = excluded.default_organization_id,
  metadata = excluded.metadata,
  updated_at = now();

-- =========================================================
-- 6. MEMBERSHIPS
-- =========================================================
with membership_rows(user_id, organization_id, role_key, status, job_title, is_billing_contact, is_security_contact) as (
  values
    -- Harborview Health Systems
    ('a1000000-0000-4000-8000-000000000001'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'client_admin', 'approved', 'IT Director', true, true),
    ('a1000000-0000-4000-8000-000000000002'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'client_user', 'approved', 'Network Administrator', false, false),
    ('a1000000-0000-4000-8000-000000000003'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'client_user', 'approved', 'Compliance Officer', false, true),
    ('a1000000-0000-4000-8000-000000000004'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'client_user', 'approved', 'Systems Analyst', false, false),
    ('a1000000-0000-4000-8000-000000000005'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'client_user', 'pending', 'Security Analyst', false, false),
    -- Brightline Retail Group
    ('b2000000-0000-4000-8000-000000000001'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'client_admin', 'approved', 'VP of IT', true, true),
    ('b2000000-0000-4000-8000-000000000002'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'client_user', 'approved', 'Store Systems Lead', false, false),
    ('b2000000-0000-4000-8000-000000000003'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'client_user', 'approved', 'Data Analyst', false, false),
    ('b2000000-0000-4000-8000-000000000004'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'client_user', 'approved', 'POS Support Engineer', false, false),
    ('b2000000-0000-4000-8000-000000000005'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'client_user', 'suspended', 'Field Technician', false, false),
    -- Summit Financial Advisors
    ('c3000000-0000-4000-8000-000000000001'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'client_admin', 'approved', 'Managing Director', true, true),
    ('c3000000-0000-4000-8000-000000000002'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'client_user', 'approved', 'Wealth Manager', false, false),
    ('c3000000-0000-4000-8000-000000000003'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'client_user', 'approved', 'Operations Manager', true, false),
    ('c3000000-0000-4000-8000-000000000004'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'client_user', 'approved', 'Security Analyst', false, true),
    ('c3000000-0000-4000-8000-000000000005'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'client_user', 'pending', 'Compliance Analyst', false, false),
    -- MSP internal: technicians across tenants
    ('d4000000-0000-4000-8000-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'technician', 'approved', 'Senior Technician', false, true),
    ('d4000000-0000-4000-8000-000000000001'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'technician', 'approved', 'Senior Technician', false, true),
    ('d4000000-0000-4000-8000-000000000001'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'technician', 'approved', 'Senior Technician', false, true),
    ('d4000000-0000-4000-8000-000000000001'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'technician', 'approved', 'Senior Technician', false, true),
    ('d4000000-0000-4000-8000-000000000002'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'technician', 'approved', 'NOC Engineer', false, true),
    ('d4000000-0000-4000-8000-000000000002'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'technician', 'approved', 'NOC Engineer', false, true),
    ('d4000000-0000-4000-8000-000000000002'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'technician', 'approved', 'NOC Engineer', false, true),
    ('d4000000-0000-4000-8000-000000000002'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'technician', 'approved', 'NOC Engineer', false, true),
    ('d4000000-0000-4000-8000-000000000003'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'technician', 'approved', 'Security Engineer', false, true),
    ('d4000000-0000-4000-8000-000000000003'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'technician', 'approved', 'Security Engineer', false, true),
    ('d4000000-0000-4000-8000-000000000003'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'technician', 'approved', 'Security Engineer', false, true),
    ('d4000000-0000-4000-8000-000000000003'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'technician', 'approved', 'Security Engineer', false, true),
    -- MSP internal: service manager (admin on every tenant)
    ('d4000000-0000-4000-8000-000000000004'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'admin', 'approved', 'Service Manager', true, true),
    ('d4000000-0000-4000-8000-000000000004'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'admin', 'approved', 'Service Manager', true, true),
    ('d4000000-0000-4000-8000-000000000004'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'admin', 'approved', 'Service Manager', true, true),
    ('d4000000-0000-4000-8000-000000000004'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'admin', 'approved', 'Service Manager', true, true),
    ('d4000000-0000-4000-8000-000000000004'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'admin', 'approved', 'Service Manager', true, true),
    -- MSP internal: client success (portal view across two tenants)
    ('d4000000-0000-4000-8000-000000000005'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'client_user', 'approved', 'Client Success Manager', false, false),
    ('d4000000-0000-4000-8000-000000000005'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'client_user', 'approved', 'Client Success Manager', false, false),
    -- Platform super admin across all new demo tenants
    ('66ce903f-6fe0-45da-878b-a0398e6b1981'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'super_admin', 'approved', 'Global Super Admin', true, true),
    ('66ce903f-6fe0-45da-878b-a0398e6b1981'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'super_admin', 'approved', 'Global Super Admin', true, true),
    ('66ce903f-6fe0-45da-878b-a0398e6b1981'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'super_admin', 'approved', 'Global Super Admin', true, true)
)
insert into public.memberships (
  organization_id, user_id, role_id, status, approved_by, approved_at, job_title,
  is_billing_contact, is_security_contact
)
select
  m.organization_id, m.user_id, r.id, m.status::public.membership_status,
  'd4000000-0000-4000-8000-000000000004'::uuid,
  case when m.status = 'approved' then now() else null end,
  m.job_title, m.is_billing_contact, m.is_security_contact
from membership_rows m
join public.roles r on r.key = m.role_key
on conflict (organization_id, user_id) do update
set
  role_id = excluded.role_id,
  status = excluded.status,
  approved_by = excluded.approved_by,
  approved_at = excluded.approved_at,
  job_title = excluded.job_title,
  is_billing_contact = excluded.is_billing_contact,
  is_security_contact = excluded.is_security_contact,
  updated_at = now();

-- =========================================================
-- 7. USER PERMISSION OVERRIDES (RBAC edge cases)
-- =========================================================
insert into public.user_permission_overrides (organization_id, user_id, permission_id, is_allowed)
select '33333333-3333-4333-8333-333333333333'::uuid, 'a1000000-0000-4000-8000-000000000002'::uuid, p.id, false
from public.permissions p where p.module_key = 'billing' and p.action_key = 'view'
on conflict (organization_id, user_id, permission_id) do nothing;

insert into public.user_permission_overrides (organization_id, user_id, permission_id, is_allowed)
select '44444444-4444-4444-8444-444444444444'::uuid, 'b2000000-0000-4000-8000-000000000001'::uuid, p.id, true
from public.permissions p where p.module_key = 'tickets' and p.action_key = 'delete'
on conflict (organization_id, user_id, permission_id) do nothing;

insert into public.user_permission_overrides (organization_id, user_id, permission_id, is_allowed)
select '55555555-5555-4555-8555-555555555555'::uuid, 'c3000000-0000-4000-8000-000000000003'::uuid, p.id, false
from public.permissions p where p.module_key = 'documents' and p.action_key = 'delete'
on conflict (organization_id, user_id, permission_id) do nothing;

-- =========================================================
-- 8. NOTIFICATION PREFERENCES
-- =========================================================
insert into public.notification_preferences (organization_id, user_id, module_key, channel, enabled)
values
  ('33333333-3333-4333-8333-333333333333'::uuid, 'a1000000-0000-4000-8000-000000000002'::uuid, 'tickets', 'email', true),
  ('33333333-3333-4333-8333-333333333333'::uuid, 'a1000000-0000-4000-8000-000000000002'::uuid, 'tickets', 'in_app', true),
  ('33333333-3333-4333-8333-333333333333'::uuid, 'a1000000-0000-4000-8000-000000000002'::uuid, 'projects', 'email', false),
  ('44444444-4444-4444-8444-444444444444'::uuid, 'b2000000-0000-4000-8000-000000000002'::uuid, 'tickets', 'email', false),
  ('55555555-5555-4555-8555-555555555555'::uuid, 'c3000000-0000-4000-8000-000000000002'::uuid, 'documents', 'in_app', true)
on conflict (organization_id, user_id, module_key, channel) do nothing;

-- =========================================================
-- 9. NOTIFICATIONS
-- =========================================================
insert into public.notifications (user_id, organization_id, title, body, module, module_id, action, read, created_at)
values
  ('a1000000-0000-4000-8000-000000000002'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Ticket Updated', 'Your ticket "VPN drops on Radiology floor" has been updated.', 'tickets', '52600000-0000-0000-0000-000000000001', 'updated', false, now() - interval '3 hours'),
  ('a1000000-0000-4000-8000-000000000001'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Approval Needed', 'A new change request requires your approval.', 'approvals', '57600000-0000-0000-0000-000000000001', 'created', false, now() - interval '1 day'),
  ('b2000000-0000-4000-8000-000000000002'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'Finding Assigned', 'You were assigned finding "POS terminals missing disk encryption".', 'findings', '55600000-0000-0000-0000-000000000003', 'assigned', false, now() - interval '2 hours'),
  ('c3000000-0000-4000-8000-000000000002'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'Invoice Open', 'Invoice MCT-SUMMIT-5001 is due soon.', 'billing', null, 'overdue', true, now() - interval '1 day'),
  ('d4000000-0000-4000-8000-000000000001'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Task Assigned', 'You have been assigned "Deploy firewall rules".', 'projects', '53700000-0000-0000-0000-000000000002', 'assigned', false, now() - interval '30 minutes')
on conflict do nothing;

-- =========================================================
-- 10. TICKETS + COMMENTS
-- =========================================================
insert into public.tickets (
  id, organization_id, created_by, assigned_to, title, description, status, priority, category, source, labels, metadata
)
values
  ('52600000-0000-0000-0000-000000000001'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'a1000000-0000-4000-8000-000000000002'::uuid, 'd4000000-0000-4000-8000-000000000001'::uuid, 'VPN drops on Radiology floor', 'Users on the Radiology floor lose VPN connectivity every morning around 9am.', 'open', 'high', 'network', 'portal', '{vpn,connectivity}', jsonb_build_object('seeded', true)),
  ('52600000-0000-0000-0000-000000000002'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'a1000000-0000-4000-8000-000000000003'::uuid, 'd4000000-0000-4000-8000-000000000003'::uuid, 'HIPAA audit evidence request', 'Need the access review report for Q3 to complete the HIPAA readiness audit.', 'in_progress', 'normal', 'compliance', 'portal', '{hipaa,compliance}', jsonb_build_object('seeded', true)),
  ('52600000-0000-0000-0000-000000000003'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'a1000000-0000-4000-8000-000000000004'::uuid, 'd4000000-0000-4000-8000-000000000002'::uuid, 'New workstation imaging on 3rd floor', 'Twelve new workstations need to be imaged and joined to the domain.', 'open', 'low', 'hardware', 'portal', '{imaging,hardware}', jsonb_build_object('seeded', true)),
  ('52600000-0000-0000-0000-000000000004'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'b2000000-0000-4000-8000-000000000002'::uuid, 'd4000000-0000-4000-8000-000000000001'::uuid, 'POS terminal offline at Store 42', 'Register 3 at Store 42 cannot connect to the payment gateway.', 'open', 'urgent', 'infrastructure', 'portal', '{pos,store42}', jsonb_build_object('seeded', true)),
  ('52600000-0000-0000-0000-000000000005'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'b2000000-0000-4000-8000-000000000003'::uuid, 'd4000000-0000-4000-8000-000000000002'::uuid, 'Sales reporting export failing', 'The nightly sales export to the data warehouse has failed 3 nights in a row.', 'in_progress', 'normal', 'data', 'portal', '{reporting,data}', jsonb_build_object('seeded', true)),
  ('52600000-0000-0000-0000-000000000006'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'c3000000-0000-4000-8000-000000000002'::uuid, 'd4000000-0000-4000-8000-000000000003'::uuid, 'Email phishing simulation clicked', 'A user clicked a link in the latest phishing simulation - need a training follow-up.', 'open', 'high', 'security', 'portal', '{phishing,training}', jsonb_build_object('seeded', true)),
  ('52600000-0000-0000-0000-000000000007'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'c3000000-0000-4000-8000-000000000003'::uuid, 'd4000000-0000-4000-8000-000000000001'::uuid, 'Client portal two-factor enrollment', 'We need to enroll all advisors in two-factor authentication for the portal.', 'in_progress', 'normal', 'security', 'portal', '{mfa,enrollment}', jsonb_build_object('seeded', true)),
  ('52600000-0000-0000-0000-000000000008'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'd4000000-0000-4000-8000-000000000004'::uuid, 'd4000000-0000-4000-8000-000000000001'::uuid, 'Printer queue on production floor', 'Label printer on the production floor is stuck in the queue.', 'resolved', 'low', 'hardware', 'portal', '{printer,production}', jsonb_build_object('seeded', true)),
  ('52600000-0000-0000-0000-000000000009'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'd4000000-0000-4000-8000-000000000002'::uuid, 'd4000000-0000-4000-8000-000000000002'::uuid, 'Case management system upgrade', 'Schedule the upgrade window for the case management system.', 'open', 'normal', 'software', 'portal', '{upgrade,casemanagement}', jsonb_build_object('seeded', true))
on conflict (id) do nothing;

insert into public.ticket_comments (id, ticket_id, organization_id, author_id, body, is_internal, created_at)
values
  ('52700000-0000-0000-0000-000000000001'::uuid, '52600000-0000-0000-0000-000000000001'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'd4000000-0000-4000-8000-000000000001'::uuid, 'Checked the access points on the Radiology floor - one AP is rebooting daily. Replacing this weekend.', true, now() - interval '1 day'),
  ('52700000-0000-0000-0000-000000000002'::uuid, '52600000-0000-0000-0000-000000000001'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'a1000000-0000-4000-8000-000000000002'::uuid, 'Thanks - please keep us posted on the replacement window.', false, now() - interval '20 hours'),
  ('52700000-0000-0000-0000-000000000003'::uuid, '52600000-0000-0000-0000-000000000004'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'd4000000-0000-4000-8000-000000000001'::uuid, 'Rebooted the gateway at Store 42 - monitoring connectivity now.', true, now() - interval '5 hours'),
  ('52700000-0000-0000-0000-000000000004'::uuid, '52600000-0000-0000-0000-000000000006'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'd4000000-0000-4000-8000-000000000003'::uuid, 'User identified - assigning the security awareness training module.', true, now() - interval '3 hours')
on conflict (id) do nothing;

-- =========================================================
-- 11. PROJECTS + TASKS + MEMBERS
-- =========================================================
insert into public.projects (
  id, organization_id, created_by, owner_id, name, description, status, priority, starts_at, due_at, progress_percent, metadata
)
values
  ('53600000-0000-0000-0000-000000000001'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'd4000000-0000-4000-8000-000000000004'::uuid, 'd4000000-0000-4000-8000-000000000001'::uuid, 'HIPAA Readiness Assessment', 'Annual HIPAA compliance assessment across all departments.', 'active', 'high', now() - interval '30 days', now() + interval '45 days', 35, jsonb_build_object('seeded', true)),
  ('53600000-0000-0000-0000-000000000002'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'd4000000-0000-4000-8000-000000000004'::uuid, 'd4000000-0000-4000-8000-000000000002'::uuid, 'Network Segmentation Project', 'Segment the hospital network into clinical and administrative zones.', 'active', 'medium', now() - interval '15 days', now() + interval '60 days', 15, jsonb_build_object('seeded', true)),
  ('53600000-0000-0000-0000-000000000003'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'd4000000-0000-4000-8000-000000000004'::uuid, 'b2000000-0000-4000-8000-000000000002'::uuid, 'Store 42 Refresh', 'Full IT refresh for the flagship store location.', 'active', 'high', now() - interval '10 days', now() + interval '20 days', 50, jsonb_build_object('seeded', true)),
  ('53600000-0000-0000-0000-000000000004'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'd4000000-0000-4000-8000-000000000004'::uuid, 'c3000000-0000-4000-8000-000000000004'::uuid, 'Zero Trust Rollout', 'Roll out zero trust architecture for remote advisors.', 'planned', 'high', now(), now() + interval '90 days', 5, jsonb_build_object('seeded', true))
on conflict (id) do nothing;

-- NOTE: project_members was dropped in migration 5302055; project
-- participants are derived from memberships, so no member rows here.

insert into public.project_tasks (
  id, project_id, organization_id, created_by, owner_id, title, description, status, due_at, sort_order, estimate_hours, metadata
)
values
  ('53700000-0000-0000-0000-000000000001'::uuid, '53600000-0000-0000-0000-000000000001'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'd4000000-0000-4000-8000-000000000004'::uuid, 'a1000000-0000-4000-8000-000000000003'::uuid, 'Review access controls', 'Review AD group memberships for clinical systems.', 'in_progress', now() + interval '10 days', 10, 8.00, jsonb_build_object('seeded', true)),
  ('53700000-0000-0000-0000-000000000002'::uuid, '53600000-0000-0000-0000-000000000002'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'd4000000-0000-4000-8000-000000000004'::uuid, 'd4000000-0000-4000-8000-000000000001'::uuid, 'Deploy firewall rules', 'Deploy inter-zone firewall rules per the segmentation design.', 'todo', now() + interval '20 days', 10, 16.00, jsonb_build_object('seeded', true)),
  ('53700000-0000-0000-0000-000000000003'::uuid, '53600000-0000-0000-0000-000000000003'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'd4000000-0000-4000-8000-000000000004'::uuid, 'b2000000-0000-4000-8000-000000000002'::uuid, 'Replace POS terminals', 'Replace legacy POS terminals at checkout lanes 1-8.', 'in_progress', now() + interval '12 days', 10, 24.00, jsonb_build_object('seeded', true)),
  ('53700000-0000-0000-0000-000000000004'::uuid, '53600000-0000-0000-0000-000000000004'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'd4000000-0000-4000-8000-000000000004'::uuid, 'c3000000-0000-4000-8000-000000000004'::uuid, 'Enroll advisors in MFA', 'Enroll all 40 advisors in MFA for remote access.', 'todo', now() + interval '30 days', 10, 12.00, jsonb_build_object('seeded', true))
on conflict (id) do nothing;

-- =========================================================
-- 12. DOCUMENTS + VERSIONS
-- =========================================================
insert into public.documents (
  id, organization_id, uploaded_by, name, folder_path, storage_bucket, storage_path, mime_type, visibility, current_version, metadata
)
values
  ('54600000-0000-0000-0000-000000000001'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'd4000000-0000-4000-8000-000000000004'::uuid, 'HIPAA-Readiness-Report-Q3.pdf', 'compliance', 'documents', '33333333-3333-4333-8333-333333333333/compliance/hipaa-readiness-q3.pdf', 'application/pdf', 'org', 1, jsonb_build_object('seeded', true)),
  ('54600000-0000-0000-0000-000000000002'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'a1000000-0000-4000-8000-000000000001'::uuid, 'Network-Diagram-Radiology.docx', 'network', 'documents', '33333333-3333-4333-8333-333333333333/network/radiology-floor.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'org', 2, jsonb_build_object('seeded', true)),
  ('54600000-0000-0000-0000-000000000003'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'b2000000-0000-4000-8000-000000000001'::uuid, 'Store-42-Refresh-Scope.pdf', 'projects', 'documents', '44444444-4444-4444-8444-444444444444/projects/store42-refresh-scope.pdf', 'application/pdf', 'org', 1, jsonb_build_object('seeded', true)),
  ('54600000-0000-0000-0000-000000000004'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'd4000000-0000-4000-8000-000000000004'::uuid, 'Zero-Trust-Architecture-v1.pdf', 'security', 'documents', '55555555-5555-4555-8555-555555555555/security/zero-trust-architecture-v1.pdf', 'application/pdf', 'org', 1, jsonb_build_object('seeded', true))
on conflict (id) do nothing;

insert into public.document_versions (id, document_id, version_number, storage_path, uploaded_by, checksum, created_at)
values
  ('54700000-0000-0000-0000-000000000001'::uuid, '54600000-0000-0000-0000-000000000002'::uuid, 1, '33333333-3333-4333-8333-333333333333/network/radiology-floor-v1.docx', 'a1000000-0000-4000-8000-000000000001'::uuid, 'sha256:seed-v1', now() - interval '20 days'),
  ('54700000-0000-0000-0000-000000000002'::uuid, '54600000-0000-0000-0000-000000000002'::uuid, 2, '33333333-3333-4333-8333-333333333333/network/radiology-floor-v2.docx', 'a1000000-0000-4000-8000-000000000001'::uuid, 'sha256:seed-v2', now() - interval '5 days')
on conflict (id) do nothing;

-- =========================================================
-- 13. ASSETS
-- =========================================================
insert into public.assets (
  id, organization_id, name, asset_type, make, model, serial_number, asset_tag, status, visibility, location, site, purchase_date, purchase_price, warranty_expires, owner_user_id, created_by
)
values
  ('56600000-0000-0000-0000-000000000001'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Radiology Floor AP-7', 'network_device', 'Cisco', 'Catalyst 9130AXI', 'SN-AP-9130-001', 'MCT-HARB-AP-001', 'in_use', 'organization', 'Radiology Floor', 'Main Campus', '2025-03-15', 1899.00, '2028-03-15', 'a1000000-0000-4000-8000-000000000002'::uuid, 'd4000000-0000-4000-8000-000000000004'::uuid),
  ('56600000-0000-0000-0000-000000000002'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Server Room UPS-2', 'power', 'APC', 'SMT2200RM2U', 'SN-UPS-2200-002', 'MCT-HARB-UPS-002', 'in_use', 'organization', 'Server Room', 'Main Campus', '2024-11-02', 1450.00, '2027-11-02', null, 'd4000000-0000-4000-8000-000000000004'::uuid),
  ('56600000-0000-0000-0000-000000000003'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'Store 42 POS Register 3', 'workstation', 'HP', 'EliteDesk 800 G6', 'SN-POS-42-003', 'MCT-BRIG-POS-003', 'offline', 'organization', 'Checkout Lane 3', 'Store 42', '2023-06-20', 1100.00, '2026-06-20', 'b2000000-0000-4000-8000-000000000002'::uuid, 'd4000000-0000-4000-8000-000000000004'::uuid),
  ('56600000-0000-0000-0000-000000000004'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'Advisor Laptop Pool - Laptop 12', 'laptop', 'Dell', 'Latitude 7440', 'SN-LAT-7440-012', 'MCT-SUM-LT-012', 'in_use', 'organization', 'Advisor Pool', 'HQ', '2025-01-10', 1650.00, '2028-01-10', 'c3000000-0000-4000-8000-000000000002'::uuid, 'd4000000-0000-4000-8000-000000000004'::uuid),
  ('56600000-0000-0000-0000-000000000005'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Production Floor Switch-4', 'network_device', 'Juniper', 'EX2300-24P', 'SN-EX2300-004', 'MCT-ACME-SW-004', 'retired', 'organization', 'Production Floor', 'Plant A', '2021-05-01', 2200.00, '2024-05-01', null, 'd4000000-0000-4000-8000-000000000004'::uuid)
on conflict (id) do nothing;

-- =========================================================
-- 14. FINDINGS
-- =========================================================
insert into public.findings (
  id, organization_id, title, description, severity, status, source, visibility, finding_category, remediation_plan, remediation_deadline, affected_systems, assigned_to, created_by
)
values
  ('55600000-0000-0000-0000-000000000001'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Legacy TLS on PACS interface', 'The PACS imaging interface still accepts TLS 1.0 connections.', 'high', 'open', 'vulnerability_scan', 'organization', 'encryption', 'Disable TLS 1.0/1.1 on the PACS load balancer and re-test imaging workflows.', now() + interval '30 days', '{PACS,Imaging}', 'd4000000-0000-4000-8000-000000000003'::uuid, 'd4000000-0000-4000-8000-000000000004'::uuid),
  ('55600000-0000-0000-0000-000000000002'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Shared service account on pharmacy systems', 'Three pharmacy workstations share a single service account with local admin rights.', 'critical', 'open', 'security_review', 'organization', 'identity', 'Create per-workstation service accounts and rotate the existing credential.', now() + interval '14 days', '{Pharmacy}', null, 'd4000000-0000-4000-8000-000000000004'::uuid),
  ('55600000-0000-0000-0000-000000000003'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'POS terminals missing disk encryption', 'Three POS terminals at Store 42 have BitLocker disabled.', 'high', 'open', 'endpoint_scan', 'organization', 'endpoint', 'Enable BitLocker on all POS terminals and enroll keys in Intune.', now() + interval '21 days', '{POS,Store 42}', 'b2000000-0000-4000-8000-000000000002'::uuid, 'd4000000-0000-4000-8000-000000000004'::uuid),
  ('55600000-0000-0000-0000-000000000004'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'Unpatched VPN appliance', 'The remote access VPN appliance is two patch releases behind.', 'medium', 'in_progress', 'vulnerability_scan', 'organization', 'patching', 'Schedule maintenance window to apply latest firmware.', now() + interval '45 days', '{VPN}', 'd4000000-0000-4000-8000-000000000001'::uuid, 'd4000000-0000-4000-8000-000000000004'::uuid),
  ('55600000-0000-0000-0000-000000000005'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'Guest Wi-Fi VLAN overlap', 'Guest Wi-Fi traffic can reach the case management VLAN at one branch office.', 'high', 'open', 'security_review', 'organization', 'network', 'Reconfigure the branch switch to isolate the guest VLAN.', now() + interval '30 days', '{Branch Office}', 'd4000000-0000-4000-8000-000000000002'::uuid, 'd4000000-0000-4000-8000-000000000004'::uuid)
on conflict (id) do nothing;

-- =========================================================
-- 15. APPROVAL REQUESTS
-- =========================================================
insert into public.approval_requests (
  id, organization_id, request_type, request_subject, request_body, source_module, status, priority, requested_by, assigned_to, due_at, request_metadata
)
values
  ('57600000-0000-0000-0000-000000000001'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'change_approval', 'Firewall rule deployment - Radiology segment', 'Approve the deployment of 12 inter-zone firewall rules for the Radiology segment.', 'governance', 'pending', 'high', 'd4000000-0000-4000-8000-000000000001'::uuid, 'a1000000-0000-4000-8000-000000000001'::uuid, now() + interval '7 days', jsonb_build_object('seeded', true)),
  ('57600000-0000-0000-0000-000000000002'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'budget_approval', 'Q4 hardware refresh budget', 'Approve the Q4 budget for 25 workstation replacements.', 'budgets', 'approved', 'medium', 'a1000000-0000-4000-8000-000000000001'::uuid, null, null, jsonb_build_object('seeded', true)),
  ('57600000-0000-0000-0000-000000000003'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'access_request', 'Remote access for new district manager', 'New district manager needs VPN and shared drive access.', 'users', 'pending', 'medium', 'b2000000-0000-4000-8000-000000000002'::uuid, 'b2000000-0000-4000-8000-000000000001'::uuid, now() + interval '3 days', jsonb_build_object('seeded', true)),
  ('57600000-0000-0000-0000-000000000004'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'change_approval', 'Zero trust pilot - advisor cohort', 'Approve enrolling 10 advisors in the zero trust pilot program.', 'governance', 'pending', 'high', 'd4000000-0000-4000-8000-000000000004'::uuid, 'c3000000-0000-4000-8000-000000000001'::uuid, now() + interval '5 days', jsonb_build_object('seeded', true)),
  ('57600000-0000-0000-0000-000000000005'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'budget_approval', 'Phishing simulation expansion', 'Approve expanding phishing simulations to all departments.', 'edu-automation', 'rejected', 'low', 'd4000000-0000-4000-8000-000000000004'::uuid, null, null, jsonb_build_object('seeded', true, 'rejection_reason', 'Defer to next quarter'))
on conflict (id) do nothing;

-- =========================================================
-- 16. FILE REQUESTS
-- =========================================================
insert into public.file_requests (
  id, organization_id, title, description, token, storage_path, max_file_size_mb, allowed_mime_types, max_files, expires_at, status, visibility, notify_on_upload, created_by, metadata
)
values
  ('58600000-0000-0000-0000-000000000001'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Insurance certificates - vendors', 'Please upload current COI documents for all active vendors.', 'seed-token-harborview-001', '33333333-3333-4333-8333-333333333333/file-requests/vendor-coi', 25, '{pdf,docx}', 10, now() + interval '30 days', 'open', 'organization', true, 'a1000000-0000-4000-8000-000000000001'::uuid, jsonb_build_object('seeded', true)),
  ('58600000-0000-0000-0000-000000000002'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'New store opening docs', 'Upload floor plans and network requirements for the new Store 55.', 'seed-token-brightline-001', '44444444-4444-4444-8444-444444444444/file-requests/store55', 50, '{pdf,zip,png}', 20, now() + interval '14 days', 'open', 'organization', true, 'b2000000-0000-4000-8000-000000000001'::uuid, jsonb_build_object('seeded', true)),
  ('58600000-0000-0000-0000-000000000003'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'Year-end compliance evidence', 'Upload the signed BCP/DR test attestations for year-end.', 'seed-token-summit-001', '55555555-5555-4555-8555-555555555555/file-requests/year-end-compliance', 25, '{pdf}', 5, now() + interval '21 days', 'open', 'organization', true, 'c3000000-0000-4000-8000-000000000003'::uuid, jsonb_build_object('seeded', true))
on conflict (id) do nothing;

-- =========================================================
-- 17. VENDOR CONTRACTS + CONTACTS
-- =========================================================
insert into public.vendor_contracts (
  id, organization_id, vendor_name, service_name, contract_number, start_date, end_date, renewal_date, contract_value, billing_frequency, auto_renews, renewal_notice_days, status, contract_type, notes, visibility, created_by
)
values
  ('59600000-0000-0000-0000-000000000001'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'MedSoft Imaging', 'PACS maintenance', 'CT-MEDSOFT-2024-01', '2024-06-01', '2026-05-31', '2026-04-01', 48000.00, 'annual', true, 60, 'active', 'software', 'Annual maintenance renewal includes 24/7 support.', 'organization', 'd4000000-0000-4000-8000-000000000004'::uuid),
  ('59600000-0000-0000-0000-000000000002'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'PharmaLink', 'Pharmacy system hosting', 'CT-PHARM-2023-03', '2023-03-15', '2026-03-14', '2026-02-14', 24000.00, 'annual', false, 90, 'active', 'hosting', 'On-premise hosting with 99.9% SLA.', 'organization', 'd4000000-0000-4000-8000-000000000004'::uuid),
  ('59600000-0000-0000-0000-000000000003'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'POSReady Systems', 'POS hardware support', 'CT-POSR-2024-01', '2024-01-01', '2026-12-31', '2026-10-01', 36000.00, 'annual', true, 90, 'active', 'hardware', 'Covers all store POS terminals.', 'organization', 'd4000000-0000-4000-8000-000000000004'::uuid),
  ('59600000-0000-0000-0000-000000000004'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'SecureVault', 'Encrypted file sharing platform', 'CT-SV-2025-02', '2025-02-01', '2026-01-31', '2026-01-01', 12000.00, 'annual', false, 45, 'expiring', 'software', 'Renegotiate - usage below plan minimums.', 'organization', 'd4000000-0000-4000-8000-000000000004'::uuid)
on conflict (id) do nothing;

insert into public.vendor_contacts (
  id, organization_id, vendor_name, contact_name, role_title, email, phone, support_portal_url, account_number, is_primary, status, created_by
)
values
  ('59610000-0000-0000-0000-000000000001'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'MedSoft Imaging', 'Rachel Kim', 'Account Manager', 'rkim@medsoft.example', '800-555-0141', 'https://support.medsoft.example', 'MS-88231', true, 'active', 'd4000000-0000-4000-8000-000000000004'::uuid),
  ('59610000-0000-0000-0000-000000000002'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'PharmaLink', 'David Osei', 'Support Lead', 'dosei@pharmalink.example', '800-555-0142', 'https://portal.pharmalink.example', 'PL-44190', true, 'active', 'd4000000-0000-4000-8000-000000000004'::uuid),
  ('59610000-0000-0000-0000-000000000003'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'POSReady Systems', 'Ingrid Larson', 'Technical Account Manager', 'ilarson@posready.example', '800-555-0143', 'https://support.posready.example', 'PR-77315', true, 'active', 'd4000000-0000-4000-8000-000000000004'::uuid),
  ('59610000-0000-0000-0000-000000000004'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'SecureVault', 'Markus Weber', 'Enterprise Sales', 'mweber@securevault.example', '800-555-0144', 'https://enterprise.securevault.example', 'SV-22019', true, 'active', 'd4000000-0000-4000-8000-000000000004'::uuid)
on conflict (id) do nothing;

-- =========================================================
-- 18. SERVICE CATALOG
-- =========================================================
insert into public.service_catalog (
  id, organization_id, name, description, category, billing_model, unit, base_price, included_units, is_bundled, is_active, status, visibility, created_by, metadata
)
values
  ('60600000-0000-0000-0000-000000000001'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Managed Workstation', 'Fully managed workstation with AV, patching and helpdesk.', 'endpoint', 'per_device', 'device', 45.00, 200, true, true, 'active', 'organization', 'd4000000-0000-4000-8000-000000000004'::uuid, jsonb_build_object('seeded', true)),
  ('60600000-0000-0000-0000-000000000002'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'HIPAA Compliance Review', 'Quarterly HIPAA compliance review with remediation tracking.', 'compliance', 'flat', 'quarter', 1500.00, 4, false, true, 'active', 'organization', 'd4000000-0000-4000-8000-000000000004'::uuid, jsonb_build_object('seeded', true)),
  ('60600000-0000-0000-0000-000000000003'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'Store IT Support', 'Dedicated support for store locations including POS.', 'support', 'per_site', 'site', 350.00, 42, true, true, 'active', 'organization', 'd4000000-0000-4000-8000-000000000004'::uuid, jsonb_build_object('seeded', true)),
  ('60600000-0000-0000-0000-000000000004'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'Zero Trust Access', 'Zero trust remote access for advisors.', 'security', 'per_user', 'user', 18.00, 40, false, true, 'active', 'organization', 'd4000000-0000-4000-8000-000000000004'::uuid, jsonb_build_object('seeded', true))
on conflict (id) do nothing;

-- =========================================================
-- 19. QBR REPORTS
-- =========================================================
insert into public.qbr_reports (
  id, organization_id, title, period_start, period_end, status, visibility, summary, report_data, generated_by, created_by, metadata
)
values
  ('61600000-0000-0000-0000-000000000001'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Q2 2026 Business Review', '2026-04-01', '2026-06-30', 'published', 'organization', 'Strong quarter: 98% ticket SLA compliance and HIPAA readiness on track.', jsonb_build_object('tickets_resolved', 148, 'sla_compliance', 98, 'findings_open', 6), 'd4000000-0000-4000-8000-000000000004'::uuid, 'd4000000-0000-4000-8000-000000000004'::uuid, jsonb_build_object('seeded', true)),
  ('61600000-0000-0000-0000-000000000002'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'Q2 2026 Business Review', '2026-04-01', '2026-06-30', 'draft', 'organization', 'Draft - awaiting store outage details.', jsonb_build_object('tickets_resolved', 210, 'sla_compliance', 91, 'findings_open', 3), 'd4000000-0000-4000-8000-000000000004'::uuid, 'd4000000-0000-4000-8000-000000000004'::uuid, jsonb_build_object('seeded', true)),
  ('61600000-0000-0000-0000-000000000003'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'Q2 2026 Business Review', '2026-04-01', '2026-06-30', 'published', 'organization', 'Zero trust rollout started; phishing simulation completion at 82%.', jsonb_build_object('tickets_resolved', 76, 'sla_compliance', 96, 'findings_open', 2), 'd4000000-0000-4000-8000-000000000004'::uuid, 'd4000000-0000-4000-8000-000000000004'::uuid, jsonb_build_object('seeded', true))
on conflict (id) do nothing;

-- =========================================================
-- 20. TIME ENTRIES
-- =========================================================
insert into public.time_entries (
  id, organization_id, description, hours, billable, work_date, ticket_id, user_id
)
values
  ('62600000-0000-0000-0000-000000000001'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Investigate VPN connectivity on Radiology floor', 2.50, true, now() - interval '1 day', '52600000-0000-0000-0000-000000000001'::uuid, 'd4000000-0000-4000-8000-000000000001'::uuid),
  ('62600000-0000-0000-0000-000000000002'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'PACS TLS remediation planning', 1.50, true, now() - interval '2 days', null, 'd4000000-0000-4000-8000-000000000003'::uuid),
  ('62600000-0000-0000-0000-000000000003'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'Store 42 gateway reboot and monitoring', 1.00, true, now() - interval '1 day', '52600000-0000-0000-0000-000000000004'::uuid, 'd4000000-0000-4000-8000-000000000001'::uuid),
  ('62600000-0000-0000-0000-000000000004'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'VPN appliance patch assessment', 3.00, true, now() - interval '3 days', null, 'd4000000-0000-4000-8000-000000000001'::uuid),
  ('62600000-0000-0000-0000-000000000005'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Printer queue investigation and fix', 0.50, true, now() - interval '4 days', '52600000-0000-0000-0000-000000000008'::uuid, 'd4000000-0000-4000-8000-000000000001'::uuid)
on conflict (id) do nothing;

-- =========================================================
-- 21. SLA LOGS
-- =========================================================
insert into public.sla_logs (id, organization_id, ticket_id, metric, target_minutes, actual_minutes, breached, breached_at, resolved_at)
values
  ('63600000-0000-0000-0000-000000000001'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, '52600000-0000-0000-0000-000000000002'::uuid, 'first_response', 240, 155, false, null, null),
  ('63600000-0000-0000-0000-000000000002'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, '52600000-0000-0000-0000-000000000001'::uuid, 'first_response', 240, 610, true, now() - interval '2 days', null),
  ('63600000-0000-0000-0000-000000000003'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, '52600000-0000-0000-0000-000000000004'::uuid, 'first_response', 60, 42, false, null, null),
  ('63600000-0000-0000-0000-000000000004'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, '52600000-0000-0000-0000-000000000007'::uuid, 'first_response', 240, 890, true, now() - interval '1 day', null),
  ('63600000-0000-0000-0000-000000000005'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, '52600000-0000-0000-0000-000000000008'::uuid, 'resolution', 2880, 1440, false, null, now() - interval '3 days')
on conflict (id) do nothing;

-- =========================================================
-- 22. CHANGE REQUESTS
-- =========================================================
insert into public.change_requests (
  id, organization_id, title, description, change_type, risk_level, rollback_plan, implementation_date, verification_steps, status, requester_id, created_by
)
values
  ('64600000-0000-0000-0000-000000000001'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Firewall rule deployment - Radiology segment', 'Deploy 12 inter-zone rules to segment the Radiology network.', 'network_change', 'high', 'Rollback via config backup restore on the firewall.', now() + interval '7 days', 'Verify connectivity from Radiology workstations to PACS.', 'pending', 'd4000000-0000-4000-8000-000000000001'::uuid, 'd4000000-0000-4000-8000-000000000001'::uuid),
  ('64600000-0000-0000-0000-000000000002'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'Store 42 network upgrade', 'Upgrade the core switch at Store 42 during off-hours.', 'infrastructure_change', 'medium', 'Revert to the old switch if traffic fails to pass.', now() + interval '5 days', 'POS transactions flowing for 30 minutes after cutover.', 'approved', 'd4000000-0000-4000-8000-000000000002'::uuid, 'd4000000-0000-4000-8000-000000000002'::uuid),
  ('64600000-0000-0000-0000-000000000003'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'VPN appliance firmware update', 'Apply the latest firmware to the remote access VPN appliance.', 'security_change', 'medium', 'Firmware rollback via vendor recovery procedure.', now() + interval '10 days', 'Remote advisors can connect for 1 hour post-update.', 'pending', 'd4000000-0000-4000-8000-000000000001'::uuid, 'd4000000-0000-4000-8000-000000000001'::uuid)
on conflict (id) do nothing;

-- =========================================================
-- 23. RISK REGISTER
-- =========================================================
insert into public.risk_register (
  id, organization_id, risk_description, risk_category, likelihood, impact, risk_score, mitigating_controls, status, owner_user_id, created_by
)
values
  ('65600000-0000-0000-0000-000000000001'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Single point of failure in clinical network core', 'availability', 'medium', 'high', 12, 'Redundant core switches are on order; scheduled cutover next month.', 'open', 'a1000000-0000-4000-8000-000000000002'::uuid, 'd4000000-0000-4000-8000-000000000004'::uuid),
  ('65600000-0000-0000-0000-000000000002'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Legacy PACS interface EOL', 'vendor_dependency', 'high', 'medium', 15, 'Vendor extension contract signed; migration planned Q4.', 'accepted', 'a1000000-0000-4000-8000-000000000001'::uuid, 'd4000000-0000-4000-8000-000000000004'::uuid),
  ('65600000-0000-0000-0000-000000000003'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'POS malware risk from third-party apps', 'security', 'high', 'high', 20, 'App allow-listing deployed on all POS terminals.', 'mitigated', 'b2000000-0000-4000-8000-000000000002'::uuid, 'd4000000-0000-4000-8000-000000000004'::uuid),
  ('65600000-0000-0000-0000-000000000004'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'Regulatory fine from late breach reporting', 'regulatory', 'low', 'high', 8, 'Incident response runbook updated; tabletop exercises quarterly.', 'monitored', 'c3000000-0000-4000-8000-000000000004'::uuid, 'd4000000-0000-4000-8000-000000000004'::uuid)
on conflict (id) do nothing;

-- =========================================================
-- 24. DOMAIN MONITORS
-- =========================================================
insert into public.domain_monitors (
  id, organization_id, domain, display_name, zone_id, nameservers, ssl_expires, ssl_issuer, ssl_valid, spf_status, dkim_status, dmarc_status, dmarc_policy, dns_provider, cloudflare_proxied, nameserver_mismatch, check_interval_hours
)
values
  ('66600000-0000-0000-0000-000000000001'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'harborview.example', 'Harborview Health', 'zone-harborview-001', '["ns1.harborview.example","ns2.harborview.example"]'::jsonb, now() + interval '120 days', 'Let''s Encrypt', true, 'pass', 'pass', 'pass', 'reject', 'cloudflare', true, false, 24),
  ('66600000-0000-0000-0000-000000000002'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'brightline.example', 'Brightline Retail', 'zone-brightline-001', '["ns1.brightline.example","ns2.brightline.example"]'::jsonb, now() + interval '60 days', 'Let''s Encrypt', true, 'pass', 'pass', 'fail', 'none', 'cloudflare', true, false, 24),
  ('66600000-0000-0000-0000-000000000003'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'summit.example', 'Summit Financial', 'zone-summit-001', '["ns1.summit.example","ns2.summit.example"]'::jsonb, now() + interval '15 days', 'DigiCert', true, 'pass', 'fail', 'pass', 'quarantine', 'cloudflare', true, false, 24),
  ('66600000-0000-0000-0000-000000000004'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'acme.example', 'Acme Manufacturing', 'zone-acme-001', '["ns1.acme.example","ns2.acme.example"]'::jsonb, now() + interval '30 days', 'Let''s Encrypt', true, 'pass', 'pass', 'pass', 'reject', 'cloudflare', true, false, 24)
on conflict (id) do nothing;

-- =========================================================
-- 25. WEBSITE MONITORS
-- =========================================================
insert into public.website_monitors (
  id, organization_id, url, display_name, status, last_status, last_response_ms, ssl_expires, ssl_valid, lighthouse_score, check_interval_hours, alerts_enabled, created_by
)
values
  ('67600000-0000-0000-0000-000000000001'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'https://portal.harborview.example', 'Harborview Portal', 'up', 'ok', 240, now() + interval '90 days', true, 92, 5, true, 'd4000000-0000-4000-8000-000000000004'::uuid),
  ('67600000-0000-0000-0000-000000000002'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'https://www.brightline.example', 'Brightline Website', 'up', 'ok', 180, now() + interval '45 days', true, 88, 5, true, 'd4000000-0000-4000-8000-000000000004'::uuid),
  ('67600000-0000-0000-0000-000000000003'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'https://advisor.summit.example', 'Summit Advisor Portal', 'degraded', 'slow', 2900, now() + interval '20 days', true, 74, 5, true, 'd4000000-0000-4000-8000-000000000004'::uuid)
on conflict (id) do nothing;

-- =========================================================
-- 26. STORE PROMOTIONS
-- =========================================================
insert into public.store_promotions (
  id, name, badge_text, detail_text, promo_type, status, terms, eligibility_targets, start_date, end_date
)
values
  ('70600000-0000-0000-0000-000000000001'::uuid, 'Cybersecurity Essentials Bundle', 'SAVE 15%', 'Bundle Managed Workstation + HIPAA Compliance Review and save 15% on quarterly pricing.', 'bundle_savings', 'active', 'Valid for new customers only. Cannot be combined with other offers.', '{"new_customer"}', now() - interval '30 days', now() + interval '60 days'),
  ('70600000-0000-0000-0000-000000000002'::uuid, 'Store IT Support + Zero Trust Access', 'SAVE 20%', 'Combine Store IT Support with Zero Trust Access for comprehensive retail security.', 'bundle_savings', 'active', 'Minimum 12-month commitment required.', '{"retail", "multi_location"}', now() - interval '15 days', now() + interval '75 days'),
  ('70600000-0000-0000-0000-000000000003'::uuid, 'Q4 Hardware Refresh Promo', 'LIMITED TIME', 'Free managed workstation setup with any 20+ device commitment.', 'limited_time', 'paused', 'Ends Dec 31, 2026. Setup fees waived for qualifying orders.', '{"enterprise"}', now() + interval '45 days', now() + interval '120 days'),
  ('70600000-0000-0000-0000-000000000004'::uuid, 'Legacy Summer Promo 2025', 'EXPIRED', 'Summer 2025 discount on managed services.', 'seasonal', 'expired', 'Expired Aug 31, 2025.', '{}', now() - interval '1 year', now() - interval '3 months')
on conflict (id) do nothing;

-- =========================================================
-- 27. STORE QUOTES
-- =========================================================
insert into public.store_quotes (
  id, name, email, phone, notes, items, status
)
values
  ('71600000-0000-0000-0000-000000000001'::uuid, 'Jennifer Adams', 'jennifer.adams@harborview.example', '555-0301', 'Need quote for 50 managed workstations + HIPAA review for Harborview Health.', '[{"product_slug": "managed-workstation", "quantity": 50, "unit_price": 45}, {"product_slug": "hipaa-compliance-review", "quantity": 4, "unit_price": 1500}]'::jsonb, 'reviewed'),
  ('71600000-0000-0000-0000-000000000002'::uuid, 'Robert Kim', 'robert.kim@brightline.example', '555-0401', 'Interested in Store IT Support for 30 locations + Zero Trust for 200 users.', '[{"product_slug": "store-it-support", "quantity": 30, "unit_price": 350}, {"product_slug": "zero-trust-access", "quantity": 200, "unit_price": 18}]'::jsonb, 'contacted'),
  ('71600000-0000-0000-0000-000000000003'::uuid, 'Maria Santos', 'maria.santos@summit.example', '555-0501', 'Requesting quote for Zero Trust Access for 40 advisors.', '[{"product_slug": "zero-trust-access", "quantity": 40, "unit_price": 18}]'::jsonb, 'new'),
  ('71600000-0000-0000-0000-000000000004'::uuid, 'David Park', 'david.park@acme.example', '555-0601', 'Follow-up on previous inquiry - ready to move forward with 25 workstations.', '[{"product_slug": "managed-workstation", "quantity": 25, "unit_price": 45}]'::jsonb, 'converted'),
  ('71600000-0000-0000-0000-000000000005'::uuid, 'Lisa Chen', 'lisa.chen@northwind.example', '555-0701', 'Inquired about bulk pricing for 100+ devices - not responsive to follow-ups.', '[{"product_slug": "managed-workstation", "quantity": 100, "unit_price": 45}]'::jsonb, 'closed')
on conflict (id) do nothing;

end $$;
