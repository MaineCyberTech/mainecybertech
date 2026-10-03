-- Migration 5302103: Add CHECK constraints for bounded numeric fields
-- Uses DO blocks to skip tables that may not exist
-- Note: PostgreSQL does NOT support `ADD CONSTRAINT IF NOT EXISTS` (42601).
-- Guard each constraint via pg_constraint lookup instead.

do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'sla_logs')
     and not exists (select 1 from pg_constraint where conname = 'sla_logs_target_minutes_check') then
    alter table public.sla_logs add constraint sla_logs_target_minutes_check
      check (target_minutes >= 1);
  end if;
end;
$$;

do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'satisfaction_pulses')
     and not exists (select 1 from pg_constraint where conname = 'satisfaction_pulses_rating_check') then
    alter table public.satisfaction_pulses add constraint satisfaction_pulses_rating_check
      check (rating >= 1 and rating <= 10);
  end if;
end;
$$;

do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'score_history')
     and not exists (select 1 from pg_constraint where conname = 'score_history_score_check') then
    alter table public.score_history add constraint score_history_score_check
      check (score >= 0 and score <= 100);
  end if;
end;
$$;

do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'patch_compliance')
     and not exists (select 1 from pg_constraint where conname = 'patch_compliance_pct_check') then
    alter table public.patch_compliance add constraint patch_compliance_pct_check
      check (compliance_pct >= 0 and compliance_pct <= 100);
  end if;
end;
$$;

do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'endpoint_security')
     and not exists (select 1 from pg_constraint where conname = 'endpoint_security_coverage_pct_check') then
    alter table public.endpoint_security add constraint endpoint_security_coverage_pct_check
      check (coverage_pct >= 0 and coverage_pct <= 100);
  end if;
end;
$$;

do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'vendor_contracts')
     and not exists (select 1 from pg_constraint where conname = 'vendor_contracts_value_check') then
    alter table public.vendor_contracts add constraint vendor_contracts_value_check
      check (contract_value >= 0);
  end if;
end;
$$;
