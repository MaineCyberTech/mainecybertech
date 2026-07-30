-- Migration 5302103: Add CHECK constraints for bounded numeric fields
-- Uses DO blocks to skip tables that may not exist

do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'sla_logs') then
    alter table public.sla_logs add constraint if not exists sla_logs_target_minutes_check
      check (target_minutes >= 1);
  end if;
end;
$$;

do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'satisfaction_pulses') then
    alter table public.satisfaction_pulses add constraint if not exists satisfaction_pulses_rating_check
      check (rating >= 1 and rating <= 10);
  end if;
end;
$$;

do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'score_history') then
    alter table public.score_history add constraint if not exists score_history_score_check
      check (score >= 0 and score <= 100);
  end if;
end;
$$;

do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'patch_compliance') then
    alter table public.patch_compliance add constraint if not exists patch_compliance_pct_check
      check (compliance_pct >= 0 and compliance_pct <= 100);
  end if;
end;
$$;

do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'endpoint_security') then
    alter table public.endpoint_security add constraint if not exists endpoint_security_coverage_pct_check
      check (coverage_pct >= 0 and coverage_pct <= 100);
  end if;
end;
$$;

do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'vendor_contracts') then
    alter table public.vendor_contracts add constraint if not exists vendor_contracts_value_check
      check (contract_value >= 0);
  end if;
end;
$$;