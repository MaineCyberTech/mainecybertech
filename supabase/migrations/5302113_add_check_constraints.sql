-- P2 fixes (audit DATA-006 + FK-index gaps):
--
-- CHECK constraint analysis for the columns flagged by the audit:
--
--   tickets.status           -> public.ticket_status   (enum, enforces values)
--   tickets.priority         -> public.ticket_priority (enum)
--   projects.status          -> public.project_status  (enum)
--   projects.priority        -> (no such column on projects — skip)
--   documents.visibility     -> public.document_visibility (enum)
--   organizations.status     -> public.org_status      (enum)
--   memberships.status       -> public.membership_status (enum)
--   api_keys.is_active       -> boolean (only true/false/null possible)
--   webhook_endpoints.is_active -> boolean
--
-- Every one of these columns is already constrained by its PostgreSQL type,
-- so an additional CHECK would be redundant. Worse, CHECKs on enum columns
-- would BREAK future `alter type ... add value` migrations (5302030 already
-- extended ticket_status with 'open'), so they are deliberately NOT added.
--
-- Instead this migration adds the genuinely missing constraints/indexes the
-- audit called out:
--   1. CHECK (version >= 1) on all 9 optimistic-locking versioned tables
--      (5302051) — nothing currently prevents direct writes of version = 0.
--   2. FK lookup indexes (idempotent IF NOT EXISTS).
--
-- NOTE: constraints are added with a pg_constraint guard (PostgreSQL does
-- NOT support `ADD CONSTRAINT IF NOT EXISTS`).

-- =============================================================
-- 1. version >= 1 CHECK constraints (idempotent DO blocks)
-- =============================================================

do $$
declare v_relid oid;
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'tickets') then
    select c.oid into v_relid from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where c.relname = 'tickets' and n.nspname = 'public';
    if not exists (select 1 from pg_constraint where conname = 'tickets_version_check' and conrelid = v_relid) then
      alter table public.tickets add constraint tickets_version_check check (version >= 1);
    end if;
  end if;
end;
$$;

do $$
declare v_relid oid;
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'documents') then
    select c.oid into v_relid from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where c.relname = 'documents' and n.nspname = 'public';
    if not exists (select 1 from pg_constraint where conname = 'documents_version_check' and conrelid = v_relid) then
      alter table public.documents add constraint documents_version_check check (version >= 1);
    end if;
  end if;
end;
$$;

do $$
declare v_relid oid;
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'projects') then
    select c.oid into v_relid from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where c.relname = 'projects' and n.nspname = 'public';
    if not exists (select 1 from pg_constraint where conname = 'projects_version_check' and conrelid = v_relid) then
      alter table public.projects add constraint projects_version_check check (version >= 1);
    end if;
  end if;
end;
$$;

do $$
declare v_relid oid;
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'organizations') then
    select c.oid into v_relid from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where c.relname = 'organizations' and n.nspname = 'public';
    if not exists (select 1 from pg_constraint where conname = 'organizations_version_check' and conrelid = v_relid) then
      alter table public.organizations add constraint organizations_version_check check (version >= 1);
    end if;
  end if;
end;
$$;

do $$
declare v_relid oid;
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'profiles') then
    select c.oid into v_relid from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where c.relname = 'profiles' and n.nspname = 'public';
    if not exists (select 1 from pg_constraint where conname = 'profiles_version_check' and conrelid = v_relid) then
      alter table public.profiles add constraint profiles_version_check check (version >= 1);
    end if;
  end if;
end;
$$;

do $$
declare v_relid oid;
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'project_tasks') then
    select c.oid into v_relid from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where c.relname = 'project_tasks' and n.nspname = 'public';
    if not exists (select 1 from pg_constraint where conname = 'project_tasks_version_check' and conrelid = v_relid) then
      alter table public.project_tasks add constraint project_tasks_version_check check (version >= 1);
    end if;
  end if;
end;
$$;

do $$
declare v_relid oid;
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'webhook_endpoints') then
    select c.oid into v_relid from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where c.relname = 'webhook_endpoints' and n.nspname = 'public';
    if not exists (select 1 from pg_constraint where conname = 'webhook_endpoints_version_check' and conrelid = v_relid) then
      alter table public.webhook_endpoints add constraint webhook_endpoints_version_check check (version >= 1);
    end if;
  end if;
end;
$$;

do $$
declare v_relid oid;
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'notification_preferences') then
    select c.oid into v_relid from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where c.relname = 'notification_preferences' and n.nspname = 'public';
    if not exists (select 1 from pg_constraint where conname = 'notification_preferences_version_check' and conrelid = v_relid) then
      alter table public.notification_preferences add constraint notification_preferences_version_check check (version >= 1);
    end if;
  end if;
end;
$$;

do $$
declare v_relid oid;
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'billing_customers') then
    select c.oid into v_relid from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where c.relname = 'billing_customers' and n.nspname = 'public';
    if not exists (select 1 from pg_constraint where conname = 'billing_customers_version_check' and conrelid = v_relid) then
      alter table public.billing_customers add constraint billing_customers_version_check check (version >= 1);
    end if;
  end if;
end;
$$;

-- =============================================================
-- 2. FK lookup indexes (verified table/column names from migrations:
--    ticket_comments.ticket_id exists; `project_comments` does not
--    exist — the generic `comments` table was dropped in 5302055,
--    so no index is created for it).
-- =============================================================

create index if not exists idx_ticket_comments_ticket_id
  on public.ticket_comments (ticket_id);

-- document_permissions FK indexes are created in 5302110
-- (idx_document_permissions_document_id / _user_id / _role_id).
