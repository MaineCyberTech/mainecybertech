-- Migration 5302103: Add CHECK constraints for bounded numeric fields
begin;

-- sla_logs
alter table public.sla_logs add constraint if not exists sla_logs_target_minutes_check
  check (target_minutes >= 1);

-- satisfaction_pulses
alter table public.satisfaction_pulses add constraint if not exists satisfaction_pulses_rating_check
  check (rating >= 1 and rating <= 10);

-- score_history
alter table public.score_history add constraint if not exists score_history_score_check
  check (score >= 0 and score <= 100);

-- patch_compliance
alter table public.patch_compliance add constraint if not exists patch_compliance_pct_check
  check (compliance_pct >= 0 and compliance_pct <= 100);

-- endpoint_security
alter table public.endpoint_security add constraint if not exists endpoint_security_coverage_pct_check
  check (coverage_pct >= 0 and coverage_pct <= 100);

-- vendor_contracts
alter table public.vendor_contracts add constraint if not exists vendor_contracts_value_check
  check (contract_value >= 0);

commit;