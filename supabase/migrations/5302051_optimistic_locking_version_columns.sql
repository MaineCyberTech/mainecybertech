-- Optimistic locking: add version column to mutable entities
-- Version starts at 1 and increments on each update
-- If-Match header must match current version for updates to succeed

-- tickets table
alter table public.tickets add column if not exists version integer not null default 1;
create index if not exists tickets_version_idx on public.tickets(version);

-- documents table
alter table public.documents add column if not exists version integer not null default 1;
create index if not exists documents_version_idx on public.documents(version);

-- projects table
alter table public.projects add column if not exists version integer not null default 1;
create index if not exists projects_version_idx on public.projects(version);

-- organizations table
alter table public.organizations add column if not exists version integer not null default 1;
create index if not exists organizations_version_idx on public.organizations(version);

-- profiles table
alter table public.profiles add column if not exists version integer not null default 1;
create index if not exists profiles_version_idx on public.profiles(version);

-- project_tasks table
alter table public.project_tasks add column if not exists version integer not null default 1;
create index if not exists project_tasks_version_idx on public.project_tasks(version);

-- webhook_endpoints table
alter table public.webhook_endpoints add column if not exists version integer not null default 1;
create index if not exists webhook_endpoints_version_idx on public.webhook_endpoints(version);

-- notification_preferences table
alter table public.notification_preferences add column if not exists version integer not null default 1;
create index if not exists notification_preferences_version_idx on public.notification_preferences(version);

-- billing_customers table
alter table public.billing_customers add column if not exists version integer not null default 1;
create index if not exists billing_customers_version_idx on public.billing_customers(version);