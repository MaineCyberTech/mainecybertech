-- Module 7: link a security incident response to the runbook that guides it.
-- The incident-response app and the client runbook store existed as two
-- independent slices; this lets an incident reference the playbook used.
alter table incident_responses
  add column if not exists runbook_id uuid references client_runbooks(id) on delete set null;

create index if not exists idx_incident_responses_runbook
  on incident_responses(runbook_id);
