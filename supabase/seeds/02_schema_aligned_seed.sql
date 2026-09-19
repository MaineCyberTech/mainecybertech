-- seed.sql
-- Final exact schema-aligned seed for the consolidated bootstrap dated 2026-05-29.
-- Aligned to:
--   * public.organizations
--   * public.profiles
--   * public.roles (key-based lookups)
--   * public.memberships
--   * public.documents
--   * public.document_versions
--   * public.document_permissions
--
-- IMPORTANT
-- This seed intentionally does NOT create auth.users rows.
-- Instead, it reuses existing approved members in each organization as uploaders/authors.
-- That makes it safe for an existing hosted project where auth users already exist.

begin;

do $$
declare
  -- canonical org ids used throughout the project so far
  v_acme_org uuid := '11111111-1111-1111-1111-111111111111'::uuid;
  v_northwind_org uuid := '22222222-2222-2222-2222-222222222222'::uuid;

  -- canonical role ids resolved from public.roles.key
  v_role_super_admin uuid;
  v_role_admin uuid;
  v_role_client_admin uuid;
  v_role_technician uuid;
  v_role_client_user uuid;

  -- existing approved members used as uploaders/authors
  v_acme_admin_user uuid;
  v_acme_tech_user uuid;
  v_northwind_client_admin_user uuid;
  v_northwind_client_user uuid;

  -- seeded document ids
  v_doc_acme uuid := '12121212-1212-1212-1212-121212121212'::uuid;
  v_doc_northwind uuid := '34343434-3434-3434-3434-343434343434'::uuid;

  -- visibilities that must exist in this bootstrap
  v_has_private boolean := false;
  v_has_org boolean := false;
  v_has_internal boolean := false;
  v_has_public boolean := false;
begin
  -- Verify visibility enum values expected by the consolidated bootstrap
  select exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    join pg_enum e on e.enumtypid = t.oid
    where n.nspname = 'public'
      and t.typname = 'document_visibility'
      and e.enumlabel = 'private'
  ) into v_has_private;

  select exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    join pg_enum e on e.enumtypid = t.oid
    where n.nspname = 'public'
      and t.typname = 'document_visibility'
      and e.enumlabel = 'org'
  ) into v_has_org;

  select exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    join pg_enum e on e.enumtypid = t.oid
    where n.nspname = 'public'
      and t.typname = 'document_visibility'
      and e.enumlabel = 'internal'
  ) into v_has_internal;

  select exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    join pg_enum e on e.enumtypid = t.oid
    where n.nspname = 'public'
      and t.typname = 'document_visibility'
      and e.enumlabel = 'public'
  ) into v_has_public;

  if not (v_has_private and v_has_org and v_has_internal and v_has_public) then
    raise exception 'document_visibility enum is not aligned to expected values: private, org, internal, public';
  end if;

  -- Resolve role ids using the real key column
  select id into v_role_super_admin from public.roles where key = 'super_admin' limit 1;
  select id into v_role_admin from public.roles where key = 'admin' limit 1;
  select id into v_role_client_admin from public.roles where key = 'client_admin' limit 1;
  select id into v_role_technician from public.roles where key = 'technician' limit 1;
  select id into v_role_client_user from public.roles where key = 'client_user' limit 1;

  if v_role_admin is null or v_role_client_admin is null or v_role_technician is null or v_role_client_user is null then
    raise exception 'Required roles were not found in public.roles';
  end if;

  -- Keep organizations aligned with the expected canonical rows.
  insert into public.organizations (
    id,
    name,
    slug,
    status,
    settings
  )
  values
    (v_acme_org, 'Acme Manufacturing', 'acme', 'approved', '{}'::jsonb),
    (v_northwind_org, 'Northwind Legal', 'northwind', 'approved', '{}'::jsonb)
  on conflict (id) do update
    set name = excluded.name,
        slug = excluded.slug,
        status = excluded.status,
        settings = excluded.settings,
        updated_at = now();

  -- Choose real uploaders from existing approved memberships.
  -- Acme admin/super-admin preferred uploader
  select m.user_id
  into v_acme_admin_user
  from public.memberships m
  join public.roles r on r.id = m.role_id
  where m.organization_id = v_acme_org
    and m.status = 'approved'
    and r.key in ('super_admin', 'admin')
  order by case r.key when 'super_admin' then 1 when 'admin' then 2 else 3 end, m.created_at
  limit 1;

  -- Fallback: any approved Acme member
  if v_acme_admin_user is null then
    select m.user_id
    into v_acme_admin_user
    from public.memberships m
    where m.organization_id = v_acme_org
      and m.status = 'approved'
    order by m.created_at
    limit 1;
  end if;

  -- Acme technician preferred uploader for technical docs / versions fallback
  select m.user_id
  into v_acme_tech_user
  from public.memberships m
  join public.roles r on r.id = m.role_id
  where m.organization_id = v_acme_org
    and m.status = 'approved'
    and r.key = 'technician'
  order by m.created_at
  limit 1;

  if v_acme_tech_user is null then
    v_acme_tech_user := v_acme_admin_user;
  end if;

  -- Northwind client admin preferred uploader
  select m.user_id
  into v_northwind_client_admin_user
  from public.memberships m
  join public.roles r on r.id = m.role_id
  where m.organization_id = v_northwind_org
    and m.status = 'approved'
    and r.key = 'client_admin'
  order by m.created_at
  limit 1;

  if v_northwind_client_admin_user is null then
    select m.user_id
    into v_northwind_client_admin_user
    from public.memberships m
    where m.organization_id = v_northwind_org
      and m.status = 'approved'
    order by m.created_at
    limit 1;
  end if;

  -- Northwind client user preferred viewer
  select m.user_id
  into v_northwind_client_user
  from public.memberships m
  join public.roles r on r.id = m.role_id
  where m.organization_id = v_northwind_org
    and m.status = 'approved'
    and r.key = 'client_user'
  order by m.created_at
  limit 1;

  if v_northwind_client_user is null then
    v_northwind_client_user := v_northwind_client_admin_user;
  end if;

  if v_acme_admin_user is null then
    raise exception 'No approved Acme member exists to use as uploaded_by for seeded documents';
  end if;
  if v_northwind_client_admin_user is null then
    raise exception 'No approved Northwind member exists to use as uploaded_by for seeded documents';
  end if;

  -- Seed documents with the EXACT live table shape.
  insert into public.documents (
    id,
    organization_id,
    uploaded_by,
    name,
    folder_path,
    storage_bucket,
    storage_path,
    mime_type,
    visibility,
    current_version,
    metadata,
    title,
    description,
    file_name,
    file_size
  )
  values
    (
      v_doc_acme,
      v_acme_org,
      v_acme_admin_user,
      'MSA - Acme',
      'contracts',
      'documents',
      '11111111-1111-1111-1111-111111111111/contracts/msa-acme.pdf',
      'application/pdf',
      'internal',
      1,
      jsonb_build_object('seed_tag', 'final_exact', 'doc_type', 'msa'),
      'Master Services Agreement - Acme',
      'Seeded example internal agreement for Acme Manufacturing.',
      'msa-acme.pdf',
      245760
    ),
    (
      v_doc_northwind,
      v_northwind_org,
      v_northwind_client_admin_user,
      'Welcome Packet',
      'onboarding',
      'documents',
      '22222222-2222-2222-2222-222222222222/onboarding/welcome-packet.pdf',
      'application/pdf',
      'public',
      1,
      jsonb_build_object('seed_tag', 'final_exact', 'doc_type', 'welcome_packet'),
      'Northwind Welcome Packet',
      'Seeded example onboarding packet for Northwind Legal.',
      'welcome-packet.pdf',
      196608
    )
  on conflict (id) do update
    set organization_id = excluded.organization_id,
        uploaded_by = excluded.uploaded_by,
        name = excluded.name,
        folder_path = excluded.folder_path,
        storage_bucket = excluded.storage_bucket,
        storage_path = excluded.storage_path,
        mime_type = excluded.mime_type,
        visibility = excluded.visibility,
        current_version = excluded.current_version,
        metadata = excluded.metadata,
        title = excluded.title,
        description = excluded.description,
        file_name = excluded.file_name,
        file_size = excluded.file_size,
        updated_at = now();

  -- Also guard by unique storage_path in case ids differ across environments.
  update public.documents
  set
    organization_id = v_acme_org,
    uploaded_by = v_acme_admin_user,
    name = 'MSA - Acme',
    folder_path = 'contracts',
    storage_bucket = 'documents',
    mime_type = 'application/pdf',
    visibility = 'internal',
    current_version = 1,
    metadata = jsonb_build_object('seed_tag', 'final_exact', 'doc_type', 'msa'),
    title = 'Master Services Agreement - Acme',
    description = 'Seeded example internal agreement for Acme Manufacturing.',
    file_name = 'msa-acme.pdf',
    file_size = 245760,
    updated_at = now()
  where storage_path = '11111111-1111-1111-1111-111111111111/contracts/msa-acme.pdf';

  update public.documents
  set
    organization_id = v_northwind_org,
    uploaded_by = v_northwind_client_admin_user,
    name = 'Welcome Packet',
    folder_path = 'onboarding',
    storage_bucket = 'documents',
    mime_type = 'application/pdf',
    visibility = 'public',
    current_version = 1,
    metadata = jsonb_build_object('seed_tag', 'final_exact', 'doc_type', 'welcome_packet'),
    title = 'Northwind Welcome Packet',
    description = 'Seeded example onboarding packet for Northwind Legal.',
    file_name = 'welcome-packet.pdf',
    file_size = 196608,
    updated_at = now()
  where storage_path = '22222222-2222-2222-2222-222222222222/onboarding/welcome-packet.pdf';

  -- Seed exact version rows using the real unique key (document_id, version_number).
  insert into public.document_versions (
    document_id,
    version_number,
    storage_path,
    uploaded_by,
    checksum
  )
  values
    (
      v_doc_acme,
      1,
      '11111111-1111-1111-1111-111111111111/contracts/msa-acme.pdf',
      coalesce(v_acme_tech_user, v_acme_admin_user),
      'seed-final-exact-acme-v1'
    ),
    (
      v_doc_northwind,
      1,
      '22222222-2222-2222-2222-222222222222/onboarding/welcome-packet.pdf',
      v_northwind_client_admin_user,
      'seed-final-exact-northwind-v1'
    )
  on conflict (document_id, version_number) do update
    set storage_path = excluded.storage_path,
        uploaded_by = excluded.uploaded_by,
        checksum = excluded.checksum;

  -- Document permissions removed (table dropped in migration 5302055)
end $$;

commit;
