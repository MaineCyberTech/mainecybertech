-- PowerShell Script Builder Policy Guard (#31): add policy violation tracking columns
begin;

alter table powershell_scripts add column if not exists policy_violations text[] default '{}';
alter table powershell_scripts add column if not exists risk_level text default 'low';
alter table powershell_scripts add column if not exists submitted_at timestamptz;

comment on column powershell_scripts.policy_violations is 'Array of violation labels detected by policy scan';
comment on column powershell_scripts.risk_level is 'Aggregate risk level: low, medium, high, or critical';
comment on column powershell_scripts.submitted_at is 'Timestamp when script was submitted for review';

commit;
