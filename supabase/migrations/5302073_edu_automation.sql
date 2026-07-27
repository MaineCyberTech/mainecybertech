-- SOP Library (#6) + Compliance (#18) + Insurance (#26) + AI Policy (#40) + KB (#17) + Training (#25) + Phishing (#37) + Scoreboard (#39) + Automation (#13) + PowerShell (#31) + AI KB (#60)
begin;

create table if not exists sop_library (id uuid primary key default gen_random_uuid(), organization_id uuid not null references organizations(id) on delete cascade, title text not null, sop_number text, category text, version text default '1.0', framework text[], content text, status text not null default 'draft', last_reviewed_at timestamptz, next_review_at timestamptz, created_by uuid references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create index if not exists idx_sop_library_org on sop_library(organization_id);
alter table sop_library enable row level security;
create policy "sop_org" on sop_library for select using (organization_id in (select organization_id from memberships where user_id = auth.uid()));
create policy "sop_org_i" on sop_library for insert with check (organization_id in (select organization_id from memberships where user_id = auth.uid()));
create policy "sop_org_u" on sop_library for update using (organization_id in (select organization_id from memberships where user_id = auth.uid()));
create policy "sop_org_d" on sop_library for delete using (organization_id in (select organization_id from memberships where user_id = auth.uid()));

create table if not exists compliance_readiness (id uuid primary key default gen_random_uuid(), organization_id uuid not null references organizations(id) on delete cascade, framework text not null, control_id text, control_description text, is_compliant boolean default false, evidence_collected boolean default false, notes text, assessed_at timestamptz, status text not null default 'in_progress', created_by uuid references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create index if not exists idx_compliance_org on compliance_readiness(organization_id);
alter table compliance_readiness enable row level security;
create policy "cr_org" on compliance_readiness for select using (organization_id in (select organization_id from memberships where user_id = auth.uid()));
create policy "cr_org_i" on compliance_readiness for insert with check (organization_id in (select organization_id from memberships where user_id = auth.uid()));
create policy "cr_org_u" on compliance_readiness for update using (organization_id in (select organization_id from memberships where user_id = auth.uid()));
create policy "cr_org_d" on compliance_readiness for delete using (organization_id in (select organization_id from memberships where user_id = auth.uid()));

create table if not exists insurance_evidence (id uuid primary key default gen_random_uuid(), organization_id uuid not null references organizations(id) on delete cascade, category text not null, evidence_description text not null, evidence_status text default 'needed', document_reference text, collected_at timestamptz, renewal_date date, notes text, created_by uuid references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create index if not exists idx_insurance_org on insurance_evidence(organization_id);
alter table insurance_evidence enable row level security;
create policy "ie_org" on insurance_evidence for select using (organization_id in (select organization_id from memberships where user_id = auth.uid()));
create policy "ie_org_i" on insurance_evidence for insert with check (organization_id in (select organization_id from memberships where user_id = auth.uid()));
create policy "ie_org_u" on insurance_evidence for update using (organization_id in (select organization_id from memberships where user_id = auth.uid()));
create policy "ie_org_d" on insurance_evidence for delete using (organization_id in (select organization_id from memberships where user_id = auth.uid()));

create table if not exists ai_policies (id uuid primary key default gen_random_uuid(), organization_id uuid not null references organizations(id) on delete cascade, title text not null, content text, approved_tools text[], data_handling_rules text, employee_guidance text, status text not null default 'draft', approved_by uuid references auth.users(id), approved_at timestamptz, created_by uuid references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create index if not exists idx_ai_policies_org on ai_policies(organization_id);
alter table ai_policies enable row level security;
create policy "ap_org" on ai_policies for select using (organization_id in (select organization_id from memberships where user_id = auth.uid()));
create policy "ap_org_i" on ai_policies for insert with check (organization_id in (select organization_id from memberships where user_id = auth.uid()));
create policy "ap_org_u" on ai_policies for update using (organization_id in (select organization_id from memberships where user_id = auth.uid()));
create policy "ap_org_d" on ai_policies for delete using (organization_id in (select organization_id from memberships where user_id = auth.uid()));

create table if not exists knowledge_articles (id uuid primary key default gen_random_uuid(), organization_id uuid not null references organizations(id) on delete cascade, title text not null, content text, category text, tags text[], is_published boolean default false, view_count integer default 0, helpful_count integer default 0, not_helpful_count integer default 0, created_by uuid references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create index if not exists idx_kb_org on knowledge_articles(organization_id);
alter table knowledge_articles enable row level security;
create policy "kb_org" on knowledge_articles for select using (organization_id in (select organization_id from memberships where user_id = auth.uid()));
create policy "kb_org_i" on knowledge_articles for insert with check (organization_id in (select organization_id from memberships where user_id = auth.uid()));
create policy "kb_org_u" on knowledge_articles for update using (organization_id in (select organization_id from memberships where user_id = auth.uid()));
create policy "kb_org_d" on knowledge_articles for delete using (organization_id in (select organization_id from memberships where user_id = auth.uid()));

create table if not exists training_modules (id uuid primary key default gen_random_uuid(), organization_id uuid not null references organizations(id) on delete cascade, title text not null, description text, category text default 'security', duration_minutes integer, is_required boolean default false, completion_count integer default 0, status text not null default 'active', created_by uuid references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create index if not exists idx_training_org on training_modules(organization_id);
alter table training_modules enable row level security;
create policy "tm_org" on training_modules for select using (organization_id in (select organization_id from memberships where user_id = auth.uid()));
create policy "tm_org_i" on training_modules for insert with check (organization_id in (select organization_id from memberships where user_id = auth.uid()));
create policy "tm_org_u" on training_modules for update using (organization_id in (select organization_id from memberships where user_id = auth.uid()));
create policy "tm_org_d" on training_modules for delete using (organization_id in (select organization_id from memberships where user_id = auth.uid()));

create table if not exists phishing_campaigns (id uuid primary key default gen_random_uuid(), organization_id uuid not null references organizations(id) on delete cascade, campaign_name text not null, target_count integer default 0, opened_count integer default 0, clicked_count integer default 0, reported_count integer default 0, started_at timestamptz, ended_at timestamptz, notes text, status text not null default 'draft', created_by uuid references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create index if not exists idx_phishing_org on phishing_campaigns(organization_id);
alter table phishing_campaigns enable row level security;
create policy "ph_org" on phishing_campaigns for select using (organization_id in (select organization_id from memberships where user_id = auth.uid()));
create policy "ph_org_i" on phishing_campaigns for insert with check (organization_id in (select organization_id from memberships where user_id = auth.uid()));
create policy "ph_org_u" on phishing_campaigns for update using (organization_id in (select organization_id from memberships where user_id = auth.uid()));
create policy "ph_org_d" on phishing_campaigns for delete using (organization_id in (select organization_id from memberships where user_id = auth.uid()));

create table if not exists cyber_scorecards (id uuid primary key default gen_random_uuid(), organization_id uuid not null references organizations(id) on delete cascade, category text not null, score integer default 0, max_score integer default 100, badge text, last_updated timestamptz not null default now(), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create index if not exists idx_scorecards_org on cyber_scorecards(organization_id);
alter table cyber_scorecards enable row level security;
create policy "cs_org" on cyber_scorecards for select using (organization_id in (select organization_id from memberships where user_id = auth.uid()));
create policy "cs_org_i" on cyber_scorecards for insert with check (organization_id in (select organization_id from memberships where user_id = auth.uid()));
create policy "cs_org_u" on cyber_scorecards for update using (organization_id in (select organization_id from memberships where user_id = auth.uid()));
create policy "cs_org_d" on cyber_scorecards for delete using (organization_id in (select organization_id from memberships where user_id = auth.uid()));

create table if not exists automation_workflows (id uuid primary key default gen_random_uuid(), organization_id uuid not null references organizations(id) on delete cascade, name text not null, description text, script_type text default 'powershell', trigger_type text default 'manual', is_active boolean default true, last_run_at timestamptz, last_run_status text, run_count integer default 0, created_by uuid references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create index if not exists idx_automation_org on automation_workflows(organization_id);
alter table automation_workflows enable row level security;
create policy "aw_org" on automation_workflows for select using (organization_id in (select organization_id from memberships where user_id = auth.uid()));
create policy "aw_org_i" on automation_workflows for insert with check (organization_id in (select organization_id from memberships where user_id = auth.uid()));
create policy "aw_org_u" on automation_workflows for update using (organization_id in (select organization_id from memberships where user_id = auth.uid()));
create policy "aw_org_d" on automation_workflows for delete using (organization_id in (select organization_id from memberships where user_id = auth.uid()));

create table if not exists powershell_scripts (id uuid primary key default gen_random_uuid(), organization_id uuid not null references organizations(id) on delete cascade, name text not null, script_content text, policy_checked boolean default false, approval_required boolean default true, approved_by uuid references auth.users(id), approved_at timestamptz, status text not null default 'draft', created_by uuid references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create index if not exists idx_powershell_org on powershell_scripts(organization_id);
alter table powershell_scripts enable row level security;
create policy "ps_org" on powershell_scripts for select using (organization_id in (select organization_id from memberships where user_id = auth.uid()));
create policy "ps_org_i" on powershell_scripts for insert with check (organization_id in (select organization_id from memberships where user_id = auth.uid()));
create policy "ps_org_u" on powershell_scripts for update using (organization_id in (select organization_id from memberships where user_id = auth.uid()));
create policy "ps_org_d" on powershell_scripts for delete using (organization_id in (select organization_id from memberships where user_id = auth.uid()));

create table if not exists kb_article_generations (id uuid primary key default gen_random_uuid(), organization_id uuid not null references organizations(id) on delete cascade, source_ticket_id uuid references tickets(id) on delete set null, source_title text, generated_content text, reviewed_content text, status text not null default 'draft', reviewed_by uuid references auth.users(id), reviewed_at timestamptz, created_by uuid references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create index if not exists idx_kb_gen_org on kb_article_generations(organization_id);
alter table kb_article_generations enable row level security;
create policy "kbg_org" on kb_article_generations for select using (organization_id in (select organization_id from memberships where user_id = auth.uid()));
create policy "kbg_org_i" on kb_article_generations for insert with check (organization_id in (select organization_id from memberships where user_id = auth.uid()));
create policy "kbg_org_u" on kb_article_generations for update using (organization_id in (select organization_id from memberships where user_id = auth.uid()));
create policy "kbg_org_d" on kb_article_generations for delete using (organization_id in (select organization_id from memberships where user_id = auth.uid()));

commit;
