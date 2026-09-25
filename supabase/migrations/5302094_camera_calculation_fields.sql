alter table if exists public.camera_calculations add column if not exists camera_count integer default 1;
alter table if exists public.camera_calculations add column if not exists bitrate_mbps numeric(6,2) default 4.0;
alter table if exists public.camera_calculations add column if not exists retention_days integer default 30;
alter table if exists public.camera_calculations add column if not exists daily_storage_gb numeric(10,2);
alter table if exists public.camera_calculations add column if not exists recommended_nvr text;