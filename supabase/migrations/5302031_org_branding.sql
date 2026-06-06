-- Organization branding columns

alter table public.organizations
  add column if not exists logo_url text,
  add column if not exists brand_color text,
  add column if not exists accent_color text,
  add column if not exists custom_domain citext;

-- Public logos bucket for org branding
insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do nothing;

-- Allow all authenticated users to read public logos
create policy "logos_select_public"
on storage.objects for select
to authenticated
using (bucket_id = 'logos');

-- Allow all authenticated users to upload logos (API controls access via requireAdmin)
create policy "logos_insert_public"
on storage.objects for insert
to authenticated
with check (bucket_id = 'logos');
