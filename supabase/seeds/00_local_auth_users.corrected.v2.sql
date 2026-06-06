-- 00_local_auth_users.corrected.v2.sql
-- LOCAL / DEV ONLY.
-- FK-safe + generated-column-safe auth user import for automated local seed flow.

begin;

delete from auth.identities
where user_id in ('6adfefa6-27c2-480e-9881-6514f4e9b708', '817016dc-cc3b-49d1-8ee6-637f880fa0a4', 'ef0370d6-0da8-43a1-8f24-d8c4f19448a0', 'b0a65dea-16c7-4f54-8192-d9267a4219d1', '66ce903f-6fe0-45da-878b-a0398e6b1981', '71d23f2a-39b9-42f7-9ddc-115ac45ef12e', 'ebc615c1-6c95-46a6-9bf1-68a4af87b1d8')
   or provider_id in ('6adfefa6-27c2-480e-9881-6514f4e9b708', '817016dc-cc3b-49d1-8ee6-637f880fa0a4', 'ef0370d6-0da8-43a1-8f24-d8c4f19448a0', 'b0a65dea-16c7-4f54-8192-d9267a4219d1', '66ce903f-6fe0-45da-878b-a0398e6b1981', '71d23f2a-39b9-42f7-9ddc-115ac45ef12e', 'ebc615c1-6c95-46a6-9bf1-68a4af87b1d8')
   or id in ('6adfefa6-27c2-480e-9881-6514f4e9b708', '817016dc-cc3b-49d1-8ee6-637f880fa0a4', 'ef0370d6-0da8-43a1-8f24-d8c4f19448a0', 'b0a65dea-16c7-4f54-8192-d9267a4219d1', '66ce903f-6fe0-45da-878b-a0398e6b1981', '71d23f2a-39b9-42f7-9ddc-115ac45ef12e', 'ebc615c1-6c95-46a6-9bf1-68a4af87b1d8');

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  invited_at,
  confirmation_token,
  confirmation_sent_at,
  recovery_token,
  recovery_sent_at,
  email_change_token_new,
  email_change,
  email_change_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  phone,
  phone_confirmed_at,
  phone_change,
  phone_change_token,
  phone_change_sent_at,
  email_change_token_current,
  email_change_confirm_status,
  banned_until,
  reauthentication_token,
  reauthentication_sent_at,
  is_sso_user,
  deleted_at,
  is_anonymous
)
values
('00000000-0000-0000-0000-000000000000', '6adfefa6-27c2-480e-9881-6514f4e9b708', 'authenticated', 'authenticated', 'user.real@beta.example', '$2a$10$v6eIqtfdO8MPMAg6HEJUU.eHvG1iZ9bIl/apu.boe3WW5wvr2Lr2W', '2026-05-29 04:51:28.631509+00', NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}'::jsonb, '{"email_verified": true}'::jsonb, NULL, '2026-05-29 04:51:28.625592+00', '2026-05-29 04:51:28.632516+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
('00000000-0000-0000-0000-000000000000', '817016dc-cc3b-49d1-8ee6-637f880fa0a4', 'authenticated', 'authenticated', 'mspadmin.real@mainecybertech.local', '$2a$10$b.W10DuOIwSngBknhOICauM60fAT3Slmgi11Rmwf5y.Ks5NRCQdd2', '2026-05-29 04:50:23.211405+00', NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}'::jsonb, '{"email_verified": true}'::jsonb, NULL, '2026-05-29 04:50:23.1972+00', '2026-05-29 04:50:23.212608+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
('00000000-0000-0000-0000-000000000000', 'ef0370d6-0da8-43a1-8f24-d8c4f19448a0', 'authenticated', 'authenticated', 'clientadmin.real@acme.example', '$2a$10$vAOpRfZIMclV.pkfh3WbBO.toV0OMU7tx9s1G1mNbtcghwb9y/7Nq', '2026-05-29 04:50:33.572375+00', NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}'::jsonb, '{"email_verified": true}'::jsonb, NULL, '2026-05-29 04:50:33.565766+00', '2026-05-29 04:50:33.573458+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
('00000000-0000-0000-0000-000000000000', 'b0a65dea-16c7-4f54-8192-d9267a4219d1', 'authenticated', 'authenticated', 'technician.real@acme.example', '$2a$10$kKjHUF0GigeXQNk9BUxz9u4K3a0uJn80ze0zcBA3yH/NewpiUUND6', '2026-05-29 04:50:44.239967+00', NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}'::jsonb, '{"email_verified": true}'::jsonb, NULL, '2026-05-29 04:50:44.23072+00', '2026-05-29 04:50:44.240893+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
('00000000-0000-0000-0000-000000000000', '66ce903f-6fe0-45da-878b-a0398e6b1981', 'authenticated', 'authenticated', 'superadmin.real@mainecybertech.local', '$2a$10$WBaKteRHgBxhGdSfULyK0eqwF2ccw0JygnROECp.fFpypkkkTV1NC', '2026-05-29 04:50:06.694973+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-05-29 05:16:05.39343+00', '{"provider": "email", "providers": ["email"]}'::jsonb, '{"email_verified": true}'::jsonb, NULL, '2026-05-29 04:50:06.667438+00', '2026-05-30 01:10:30.142034+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
('00000000-0000-0000-0000-000000000000', '71d23f2a-39b9-42f7-9ddc-115ac45ef12e', 'authenticated', 'authenticated', 'user.real@acme.example', '$2a$10$eu7BRD7pfFGGSA5z39dRTuxJKRM18UUBFJxKMXlqOhPWzH1TMVFgy', '2026-05-29 04:51:03.011273+00', NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}'::jsonb, '{"email_verified": true}'::jsonb, NULL, '2026-05-29 04:51:03.003184+00', '2026-05-29 04:51:03.012394+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
('00000000-0000-0000-0000-000000000000', 'ebc615c1-6c95-46a6-9bf1-68a4af87b1d8', 'authenticated', 'authenticated', 'clientadmin.real@beta.example', '$2a$10$CUrxkxpGbjiS7eHARJ1RO.ylpT1QdMTfYiy2bCR5fjqplSTrh4tG2', '2026-05-29 04:51:13.409627+00', NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}'::jsonb, '{"email_verified": true}'::jsonb, NULL, '2026-05-29 04:51:13.399165+00', '2026-05-29 04:51:13.410706+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false)
on conflict (id) do update
set
  aud = excluded.aud,
  role = excluded.role,
  email = excluded.email,
  encrypted_password = excluded.encrypted_password,
  email_confirmed_at = excluded.email_confirmed_at,
  invited_at = excluded.invited_at,
  confirmation_token = excluded.confirmation_token,
  confirmation_sent_at = excluded.confirmation_sent_at,
  recovery_token = excluded.recovery_token,
  recovery_sent_at = excluded.recovery_sent_at,
  email_change_token_new = excluded.email_change_token_new,
  email_change = excluded.email_change,
  email_change_sent_at = excluded.email_change_sent_at,
  last_sign_in_at = excluded.last_sign_in_at,
  raw_app_meta_data = excluded.raw_app_meta_data,
  raw_user_meta_data = excluded.raw_user_meta_data,
  is_super_admin = excluded.is_super_admin,
  updated_at = excluded.updated_at,
  phone = excluded.phone,
  phone_confirmed_at = excluded.phone_confirmed_at,
  phone_change = excluded.phone_change,
  phone_change_token = excluded.phone_change_token,
  phone_change_sent_at = excluded.phone_change_sent_at,
  email_change_token_current = excluded.email_change_token_current,
  email_change_confirm_status = excluded.email_change_confirm_status,
  banned_until = excluded.banned_until,
  reauthentication_token = excluded.reauthentication_token,
  reauthentication_sent_at = excluded.reauthentication_sent_at,
  is_sso_user = excluded.is_sso_user,
  deleted_at = excluded.deleted_at,
  is_anonymous = excluded.is_anonymous;

insert into auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
)
values
('6adfefa6-27c2-480e-9881-6514f4e9b708', '6adfefa6-27c2-480e-9881-6514f4e9b708', '{"sub": "6adfefa6-27c2-480e-9881-6514f4e9b708", "email": "user.real@beta.example", "email_verified": true}'::jsonb, 'email', '6adfefa6-27c2-480e-9881-6514f4e9b708', NULL, '2026-05-29 04:51:28.625592+00', '2026-05-29 04:51:28.632516+00'),
('817016dc-cc3b-49d1-8ee6-637f880fa0a4', '817016dc-cc3b-49d1-8ee6-637f880fa0a4', '{"sub": "817016dc-cc3b-49d1-8ee6-637f880fa0a4", "email": "mspadmin.real@mainecybertech.local", "email_verified": true}'::jsonb, 'email', '817016dc-cc3b-49d1-8ee6-637f880fa0a4', NULL, '2026-05-29 04:50:23.1972+00', '2026-05-29 04:50:23.212608+00'),
('ef0370d6-0da8-43a1-8f24-d8c4f19448a0', 'ef0370d6-0da8-43a1-8f24-d8c4f19448a0', '{"sub": "ef0370d6-0da8-43a1-8f24-d8c4f19448a0", "email": "clientadmin.real@acme.example", "email_verified": true}'::jsonb, 'email', 'ef0370d6-0da8-43a1-8f24-d8c4f19448a0', NULL, '2026-05-29 04:50:33.565766+00', '2026-05-29 04:50:33.573458+00'),
('b0a65dea-16c7-4f54-8192-d9267a4219d1', 'b0a65dea-16c7-4f54-8192-d9267a4219d1', '{"sub": "b0a65dea-16c7-4f54-8192-d9267a4219d1", "email": "technician.real@acme.example", "email_verified": true}'::jsonb, 'email', 'b0a65dea-16c7-4f54-8192-d9267a4219d1', NULL, '2026-05-29 04:50:44.23072+00', '2026-05-29 04:50:44.240893+00'),
('66ce903f-6fe0-45da-878b-a0398e6b1981', '66ce903f-6fe0-45da-878b-a0398e6b1981', '{"sub": "66ce903f-6fe0-45da-878b-a0398e6b1981", "email": "superadmin.real@mainecybertech.local", "email_verified": true}'::jsonb, 'email', '66ce903f-6fe0-45da-878b-a0398e6b1981', '2026-05-29 05:16:05.39343+00', '2026-05-29 04:50:06.667438+00', '2026-05-30 01:10:30.142034+00'),
('71d23f2a-39b9-42f7-9ddc-115ac45ef12e', '71d23f2a-39b9-42f7-9ddc-115ac45ef12e', '{"sub": "71d23f2a-39b9-42f7-9ddc-115ac45ef12e", "email": "user.real@acme.example", "email_verified": true}'::jsonb, 'email', '71d23f2a-39b9-42f7-9ddc-115ac45ef12e', NULL, '2026-05-29 04:51:03.003184+00', '2026-05-29 04:51:03.012394+00'),
('ebc615c1-6c95-46a6-9bf1-68a4af87b1d8', 'ebc615c1-6c95-46a6-9bf1-68a4af87b1d8', '{"sub": "ebc615c1-6c95-46a6-9bf1-68a4af87b1d8", "email": "clientadmin.real@beta.example", "email_verified": true}'::jsonb, 'email', 'ebc615c1-6c95-46a6-9bf1-68a4af87b1d8', NULL, '2026-05-29 04:51:13.399165+00', '2026-05-29 04:51:13.410706+00');

commit;
