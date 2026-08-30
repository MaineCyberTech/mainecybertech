# Database Types â€” API Adoption Backlog

Generated 2026-08-26 while wiring the typed Supabase client (`Database` from
`@mct/sdk/database.types`) into the worker (adopted) and trialing it on the API.

The API clients in `apps/api/src/services/supabase.ts` remain untyped for now.
Wiring them surfaces ~259 strictness findings that this file preserves as the
adoption backlog. Categories seen:

1. **Json assignments** â€” `Record<string, unknown>` payloads assigned to
   `Json` columns. Fix: type payloads as `Record<string, Json>` or build
   Json-compatible literals.
2. **Update/Insert excess-property rejects** â€” dynamically-built row objects.
   Fix: give them explicit row types (`TablesInsert<"t">`) or inline literals.
3. **`req.query` / `req.params` widening** â€” `string | string[]` passed where
   `string` is required. Fix: coerce (`String(v)`), validate with zod, or take
   `req.params.id` (always string) instead of `req.query.x`.
4. **SelectQueryError markers** â€” column names in `.select()` strings that do
   not exist. Each one is a REAL runtime bug class; `ai.ts` `tickets.subject`
   (fixed to `title` on 2026-08-26) was found this way.

Adoption recipe: add `<Database>` to `createClient<...>()` calls in
`apps/api/src/services/supabase.ts`, run `npx tsc --noEmit`, fix per category,
and delete this file when clean.

## Raw findings

```
src/lib/webhook-dispatcher.ts(91,9): error TS2322: Type '{ event: string; data: Record<string, unknown>; }' is not assignable to type 'Json | undefined'.
  Types of property 'data' are incompatible.
    Type 'Record<string, unknown>' is not assignable to type 'Json | undefined'.
      Type 'Record<string, unknown>' is missing the following properties from type 'Json[]': length, pop, push, concat, and 29 more.
src/routes/analytics.ts(40,7): error TS2322: Type 'Record<string, unknown>' is not assignable to type 'Json | undefined'.
  Type 'Record<string, unknown>' is missing the following properties from type 'Json[]': length, pop, push, concat, and 29 more.
src/routes/api-keys.ts(110,15): error TS2345: Argument of type 'Record<string, unknown>' is not assignable to parameter of type 'RejectExcessProperties<{ created_at?: string | null | undefined; created_by?: string | null | undefined; expires_at?: string | null | undefined; id?: string | null | undefined; is_active?: boolean | null | undefined; ... 6 more ...; updated_at?: string | ... 1 more ... | undefined; }, Record<...>>'.
  Type 'Record<string, unknown>' is not assignable to type '{ [x: string]: never; }'.
    'string' index signatures are incompatible.
      Type 'unknown' is not assignable to type 'never'.
src/routes/api-keys.ts(111,17): error TS2345: Argument of type 'string | string[]' is not assignable to parameter of type 'string'.
  Type 'string[]' is not assignable to type 'string'.
src/routes/api-keys.ts(139,61): error TS2345: Argument of type 'string | string[]' is not assignable to parameter of type 'string'.
  Type 'string[]' is not assignable to type 'string'.
src/routes/approvals.ts(188,9): error TS2322: Type 'Record<string, unknown>' is not assignable to type 'Json | undefined'.
  Type 'Record<string, unknown>' is missing the following properties from type 'Json[]': length, pop, push, concat, and 29 more.
src/routes/approvals.ts(236,17): error TS2345: Argument of type 'string | string[]' is not assignable to parameter of type 'string'.
  Type 'string[]' is not assignable to type 'string'.
src/routes/approvals.ts(258,15): error TS2345: Argument of type 'Record<string, unknown>' is not assignable to parameter of type 'RejectExcessProperties<{ approved_at?: string | null | undefined; approved_by?: string | null | undefined; assigned_to?: string | null | undefined; created_at?: string | null | undefined; due_at?: string | null | undefined; ... 17 more ...; visibility?: string | ... 1 more ... | undefined; }, Record<...>>'.
  Type 'Record<string, unknown>' is not assignable to type '{ [x: string]: never; }'.
    'string' index signatures are incompatible.
      Type 'unknown' is not assignable to type 'never'.
src/routes/approvals.ts(259,17): error TS2345: Argument of type 'string | string[]' is not assignable to parameter of type 'string'.
  Type 'string[]' is not assignable to type 'string'.
src/routes/assets.ts(185,9): error TS2322: Type 'Record<string, unknown>' is not assignable to type 'Json | undefined'.
  Type 'Record<string, unknown>' is missing the following properties from type 'Json[]': length, pop, push, concat, and 29 more.
src/routes/assets.ts(224,17): error TS2345: Argument of type 'string | string[]' is not assignable to parameter of type 'string'.
  Type 'string[]' is not assignable to type 'string'.
src/routes/assets.ts(266,15): error TS2345: Argument of type 'Record<string, unknown>' is not assignable to parameter of type 'RejectExcessProperties<{ asset_tag?: string | null | undefined; asset_type?: string | null | undefined; assigned_to?: string | null | undefined; contract_reference?: string | null | undefined; created_at?: string | ... 1 more ... | undefined; ... 27 more ...; warranty_expires?: string | ... 1 more ... | undefined; }...'.
  Type 'Record<string, unknown>' is not assignable to type '{ [x: string]: never; }'.
    'string' index signatures are incompatible.
      Type 'unknown' is not assignable to type 'never'.
src/routes/assets.ts(267,17): error TS2345: Argument of type 'string | string[]' is not assignable to parameter of type 'string'.
  Type 'string[]' is not assignable to type 'string'.
src/routes/batch.ts(71,59): error TS2345: Argument of type 'Record<string, unknown>' is not assignable to parameter of type 'never[]'.
  Type 'Record<string, unknown>' is missing the following properties from type 'never[]': length, pop, push, concat, and 29 more.
src/routes/batch.ts(78,24): error TS2339: Property 'id' does not exist on type 'never'.
src/routes/batch.ts(118,17): error TS2345: Argument of type 'Record<string, unknown>' is not assignable to parameter of type 'never'.
src/routes/billing.ts(82,50): error TS2345: Argument of type 'string' is not assignable to parameter of type 'NonNullable<"open" | "draft" | "paid" | "void" | "uncollectible" | "overdue">'.
src/routes/bulk.ts(117,26): error TS2345: Argument of type 'string | null' is not assignable to parameter of type 'string'.
  Type 'null' is not assignable to type 'string'.
src/routes/bulk.ts(131,11): error TS2322: Type 'string | null' is not assignable to type 'string'.
  Type 'null' is not assignable to type 'string'.
src/routes/dmarc-coach.ts(78,74): error TS2345: Argument of type 'Record<string, unknown>' is not assignable to parameter of type 'RejectExcessProperties<{ domain: string; organization_id: string; alignment_mode?: string | null | undefined; analyzed_at?: string | null | undefined; created_at?: string | null | undefined; created_by?: string | ... 1 more ... | undefined; ... 9 more ...; status?: string | ... 1 more ... | undefined; }, { ...; }> |...'.
  Type 'Record<string, unknown>' is missing the following properties from type 'RejectExcessProperties<{ domain: string; organization_id: string; alignment_mode?: string | null | undefined; analyzed_at?: string | null | undefined; created_at?: string | null | undefined; created_by?: string | ... 1 more ... | undefined; ... 9 more ...; status?: string | ... 1 more ... | undefined; }, { ...; }>[]': length, pop, push, concat, and 29 more.
src/routes/dmarc-coach.ts(103,15): error TS2345: Argument of type 'Record<string, unknown>' is not assignable to parameter of type 'RejectExcessProperties<{ alignment_mode?: string | null | undefined; analyzed_at?: string | null | undefined; created_at?: string | null | undefined; created_by?: string | null | undefined; dkim_record?: string | ... 1 more ... | undefined; ... 10 more ...; status?: string | ... 1 more ... | undefined; }, Record<...>>'.
  Type 'Record<string, unknown>' is not assignable to type '{ [x: string]: never; }'.
    'string' index signatures are incompatible.
      Type 'unknown' is not assignable to type 'never'.
src/routes/documents.ts(196,52): error TS2345: Argument of type 'string' is not assignable to parameter of type 'NonNullable<"private" | "org" | "internal" | "public">'.
src/routes/documents.ts(247,9): error TS2322: Type 'string | null' is not assignable to type 'string'.
  Type 'null' is not assignable to type 'string'.
src/routes/documents.ts(248,9): error TS2322: Type 'string | null' is not assignable to type 'string'.
  Type 'null' is not assignable to type 'string'.
src/routes/documents.ts(252,9): error TS2322: Type 'string | null' is not assignable to type 'string'.
  Type 'null' is not assignable to type 'string'.
src/routes/documents.ts(254,9): error TS2322: Type 'Record<string, unknown> | null' is not assignable to type 'Json | undefined'.
  Type 'Record<string, unknown>' is not assignable to type 'Json | undefined'.
    Type 'Record<string, unknown>' is missing the following properties from type 'Json[]': length, pop, push, concat, and 29 more.
src/routes/documents.ts(388,11): error TS2322: Type 'string' is not assignable to type '"private" | "org" | "internal" | "public" | null | undefined'.
src/routes/documents.ts(436,78): error TS2345: Argument of type 'string | string[]' is not assignable to parameter of type 'string'.
  Type 'string[]' is not assignable to type 'string'.
src/routes/documents.ts(463,15): error TS2345: Argument of type 'Record<string, unknown>' is not assignable to parameter of type 'RejectExcessProperties<{ created_at?: string | null | undefined; current_version?: number | null | undefined; deleted_at?: string | null | undefined; deleted_by?: string | null | undefined; description?: string | ... 1 more ... | undefined; ... 14 more ...; visibility?: "private" | ... 4 more ... | undefined; }, Rec...'.
  Type 'Record<string, unknown>' is not assignable to type '{ [x: string]: never; }'.
    'string' index signatures are incompatible.
      Type 'unknown' is not assignable to type 'never'.
src/routes/documents.ts(464,17): error TS2345: Argument of type 'string | string[]' is not assignable to parameter of type 'string'.
  Type 'string[]' is not assignable to type 'string'.
src/routes/documents.ts(495,17): error TS2345: Argument of type 'string | string[]' is not assignable to parameter of type 'string'.
  Type 'string[]' is not assignable to type 'string'.
src/routes/documents.ts(505,68): error TS2345: Argument of type 'string | string[]' is not assignable to parameter of type 'string'.
  Type 'string[]' is not assignable to type 'string'.
src/routes/documents.ts(590,85): error TS2345: Argument of type '{ table_name: string; updates: { id: string; data: { folder_path: string; }; }[]; }' is not assignable to parameter of type 'undefined'.
src/routes/documents.ts(599,32): error TS2339: Property 'filter' does not exist on type 'never'.
src/routes/documents.ts(600,28): error TS2339: Property 'filter' does not exist on type 'never'.
src/routes/documents.ts(647,85): error TS2345: Argument of type '{ table_name: string; updates: { id: string; data: Record<string, unknown>; }[]; }' is not assignable to parameter of type 'undefined'.
src/routes/documents.ts(656,32): error TS2339: Property 'filter' does not exist on type 'never'.
src/routes/documents.ts(657,28): error TS2339: Property 'filter' does not exist on type 'never'.
src/routes/documents.ts(864,15): error TS2345: Argument of type 'Record<string, unknown>' is not assignable to parameter of type 'RejectExcessProperties<{ access_count?: number | null | undefined; created_at?: string | null | undefined; created_by?: string | null | undefined; document_id?: string | null | undefined; expires_at?: string | null | undefined; ... 4 more ...; token?: string | ... 1 more ... | undefined; }, Record<...>>'.
  Type 'Record<string, unknown>' is not assignable to type '{ [x: string]: never; }'.
    'string' index signatures are incompatible.
      Type 'unknown' is not assignable to type 'never'.
src/routes/domain-monitors.ts(180,9): error TS2322: Type 'Record<string, unknown>' is not assignable to type 'Json | undefined'.
  Type 'Record<string, unknown>' is missing the following properties from type 'Json[]': length, pop, push, concat, and 29 more.
src/routes/domain-monitors.ts(209,17): error TS2345: Argument of type 'string | string[]' is not assignable to parameter of type 'string'.
  Type 'string[]' is not assignable to type 'string'.
src/routes/domain-monitors.ts(213,31): error TS2339: Property 'version' does not exist on type 'SelectQueryError<"column 'version' does not exist on 'domain_monitors'.">'.
src/routes/domain-monitors.ts(234,34): error TS2339: Property 'version' does not exist on type 'SelectQueryError<"column 'version' does not exist on 'domain_monitors'.">'.
src/routes/domain-monitors.ts(238,15): error TS2345: Argument of type 'Record<string, unknown>' is not assignable to parameter of type 'RejectExcessProperties<{ alerts_enabled?: boolean | null | undefined; check_interval_hours?: number | null | undefined; cloudflare_proxied?: boolean | null | undefined; created_at?: string | null | undefined; ... 22 more ...; zone_id?: string | ... 1 more ... | undefined; }, Record<...>>'.
  Type 'Record<string, unknown>' is not assignable to type '{ [x: string]: never; }'.
    'string' index signatures are incompatible.
      Type 'unknown' is not assignable to type 'never'.
src/routes/domain-monitors.ts(239,11): error TS2345: Argument of type '"version"' is not assignable to parameter of type '"status" | "id" | "domain" | "organization_id" | "created_by" | "created_at" | "updated_at" | "visibility" | "metadata" | "owner_user_id" | "dmarc_policy" | "last_checked_at" | ... 14 more ... | "zone_id"'.
src/routes/domain-monitors.ts(239,30): error TS2339: Property 'version' does not exist on type 'SelectQueryError<"column 'version' does not exist on 'domain_monitors'.">'.
src/routes/domain-monitors.ts(240,17): error TS2345: Argument of type 'string | string[]' is not assignable to parameter of type 'string'.
  Type 'string[]' is not assignable to type 'string'.
src/routes/edu-automation.ts(80,59): error TS2345: Argument of type 'Record<string, unknown>' is not assignable to parameter of type 'never[]'.
  Type 'Record<string, unknown>' is missing the following properties from type 'never[]': length, pop, push, concat, and 29 more.
src/routes/edu-automation.ts(87,24): error TS2339: Property 'id' does not exist on type 'never'.
src/routes/edu-automation.ts(104,17): error TS2345: Argument of type 'Record<string, unknown>' is not assignable to parameter of type 'never'.
src/routes/edu-automation.ts(115,24): error TS2339: Property 'id' does not exist on type 'never'.
src/routes/edu-automation.ts(262,51): error TS2345: Argument of type '{ article_id: string; field_name: string; }' is not assignable to parameter of type 'undefined'.
src/routes/edu-automation.ts(307,17): error TS2345: Argument of type 'string | string[]' is not assignable to parameter of type 'string'.
  Type 'string[]' is not assignable to type 'string'.
src/routes/edu-automation.ts(415,17): error TS2345: Argument of type 'string | string[]' is not assignable to parameter of type 'string'.
  Type 'string[]' is not assignable to type 'string'.
src/routes/edu-automation.ts(433,17): error TS2345: Argument of type 'string | string[]' is not assignable to parameter of type 'string'.
  Type 'string[]' is not assignable to type 'string'.
src/routes/edu-automation.ts(456,17): error TS2345: Argument of type 'string | string[]' is not assignable to parameter of type 'string'.
  Type 'string[]' is not assignable to type 'string'.
src/routes/edu-automation.ts(471,17): error TS2345: Argument of type 'string | string[]' is not assignable to parameter of type 'string'.
  Type 'string[]' is not assignable to type 'string'.
src/routes/edu-automation.ts(494,17): error TS2345: Argument of type 'string | string[]' is not assignable to parameter of type 'string'.
  Type 'string[]' is not assignable to type 'string'.
src/routes/edu-automation.ts(513,17): error TS2345: Argument of type 'string | string[]' is not assignable to parameter of type 'string'.
  Type 'string[]' is not assignable to type 'string'.
src/routes/edu-automation.ts(536,17): error TS2345: Argument of type 'string | string[]' is not assignable to parameter of type 'string'.
  Type 'string[]' is not assignable to type 'string'.
src/routes/edu-automation.ts(553,17): error TS2345: Argument of type 'string | string[]' is not assignable to parameter of type 'string'.
  Type 'string[]' is not assignable to type 'string'.
src/routes/edu-automation.ts(614,30): error TS2345: Argument of type 'string | undefined' is not assignable to parameter of type 'string'.
  Type 'undefined' is not assignable to type 'string'.
src/routes/edu-automation.ts(769,19): error TS2345: Argument of type 'unknown' is not assignable to parameter of type 'string'.
src/routes/edu-automation.ts(773,9): error TS2322: Type 'unknown' is not assignable to type 'string'.
src/routes/edu-automation.ts(774,9): error TS2322: Type 'unknown' is not assignable to type 'number'.
src/routes/edu-automation.ts(780,9): error TS2322: Type 'unknown' is not assignable to type 'string | null | undefined'.
src/routes/field-services.ts(71,59): error TS2345: Argument of type 'Record<string, unknown>' is not assignable to parameter of type 'never[]'.
  Type 'Record<string, unknown>' is missing the following properties from type 'never[]': length, pop, push, concat, and 29 more.
src/routes/field-services.ts(78,24): error TS2339: Property 'id' does not exist on type 'never'.
src/routes/field-services.ts(95,17): error TS2345: Argument of type 'Record<string, unknown>' is not assignable to parameter of type 'never'.
src/routes/field-services.ts(106,24): error TS2339: Property 'id' does not exist on type 'never'.
src/routes/field-services.ts(270,15): error TS2345: Argument of type '{ [x: string]: boolean; }' is not assignable to parameter of type 'RejectExcessProperties<{ asset_tag?: string | null | undefined; configured?: boolean | null | undefined; created_at?: string | null | undefined; created_by?: string | null | undefined; device_name?: string | null | undefined; ... 12 more ...; updated_at?: string | ... 1 more ... | undefined; }, { ...; }>'.
  Type '{ [x: string]: boolean; }' is not assignable to type '{ [x: string]: never; [x: number]: never; }'.
    'string' index signatures are incompatible.
      Type 'boolean' is not assignable to type 'never'.
src/routes/file-requests.ts(114,20): error TS2345: Argument of type 'string | string[]' is not assignable to parameter of type 'string'.
  Type 'string[]' is not assignable to type 'string'.
src/routes/file-requests.ts(170,9): error TS2322: Type 'string | null' is not assignable to type 'string'.
  Type 'null' is not assignable to type 'string'.
src/routes/file-requests.ts(292,15): error TS2345: Argument of type 'Record<string, unknown>' is not assignable to parameter of type 'RejectExcessProperties<{ allowed_mime_types?: string[] | null | undefined; completed_at?: string | null | undefined; created_at?: string | null | undefined; created_by?: string | null | undefined; description?: string | ... 1 more ... | undefined; ... 13 more ...; visibility?: string | ... 1 more ... | undefined; },...'.
  Type 'Record<string, unknown>' is not assignable to type '{ [x: string]: never; }'.
    'string' index signatures are incompatible.
      Type 'unknown' is not assignable to type 'never'.
src/routes/final.ts(64,59): error TS2345: Argument of type 'Record<string, unknown>' is not assignable to parameter of type 'never[]'.
  Type 'Record<string, unknown>' is missing the following properties from type 'never[]': length, pop, push, concat, and 29 more.
src/routes/final.ts(71,24): error TS2339: Property 'id' does not exist on type 'never'.
src/routes/final.ts(112,17): error TS2345: Argument of type 'Record<string, unknown>' is not assignable to parameter of type 'never'.
src/routes/final.ts(325,80): error TS2345: Argument of type 'string | string[]' is not assignable to parameter of type 'string'.
  Type 'string[]' is not assignable to type 'string'.
src/routes/final.ts(337,17): error TS2345: Argument of type 'string | string[]' is not assignable to parameter of type 'string'.
  Type 'string[]' is not assignable to type 'string'.
src/routes/final.ts(362,80): error TS2345: Argument of type 'string | string[]' is not assignable to parameter of type 'string'.
  Type 'string[]' is not assignable to type 'string'.
src/routes/final.ts(371,17): error TS2345: Argument of type 'string | string[]' is not assignable to parameter of type 'string'.
  Type 'string[]' is not assignable to type 'string'.
src/routes/final.ts(396,80): error TS2345: Argument of type 'string | string[]' is not assignable to parameter of type 'string'.
  Type 'string[]' is not assignable to type 'string'.
src/routes/final.ts(408,17): error TS2345: Argument of type 'string | string[]' is not assignable to parameter of type 'string'.
  Type 'string[]' is not assignable to type 'string'.
src/routes/findings.ts(168,9): error TS2322: Type 'Record<string, unknown>' is not assignable to type 'Json | undefined'.
  Type 'Record<string, unknown>' is missing the following properties from type 'Json[]': length, pop, push, concat, and 29 more.
src/routes/findings.ts(208,17): error TS2345: Argument of type 'string | string[]' is not assignable to parameter of type 'string'.
  Type 'string[]' is not assignable to type 'string'.
src/routes/findings.ts(239,15): error TS2345: Argument of type 'Record<string, unknown>' is not assignable to parameter of type 'RejectExcessProperties<{ affected_systems?: string | null | undefined; assigned_to?: string | null | undefined; controls_impacted?: string | null | undefined; created_at?: string | null | undefined; created_by?: string | ... 1 more ... | undefined; ... 19 more ...; visibility?: string | ... 1 more ... | undefined; }...'.
  Type 'Record<string, unknown>' is not assignable to type '{ [x: string]: never; }'.
    'string' index signatures are incompatible.
      Type 'unknown' is not assignable to type 'never'.
src/routes/findings.ts(240,17): error TS2345: Argument of type 'string | string[]' is not assignable to parameter of type 'string'.
  Type 'string[]' is not assignable to type 'string'.
src/routes/governance.ts(80,59): error TS2345: Argument of type 'Record<string, unknown>' is not assignable to parameter of type 'never[]'.
  Type 'Record<string, unknown>' is missing the following properties from type 'never[]': length, pop, push, concat, and 29 more.
src/routes/governance.ts(87,24): error TS2339: Property 'id' does not exist on type 'never'.
src/routes/governance.ts(110,17): error TS2345: Argument of type 'Record<string, unknown>' is not assignable to parameter of type 'never'.
src/routes/governance.ts(121,24): error TS2339: Property 'id' does not exist on type 'never'.
src/routes/governance.ts(197,17): error TS2345: Argument of type 'string | string[]' is not assignable to parameter of type 'string'.
  Type 'string[]' is not assignable to type 'string'.
src/routes/governance.ts(224,17): error TS2345: Argument of type 'string | string[]' is not assignable to parameter of type 'string'.
  Type 'string[]' is not assignable to type 'string'.
src/routes/governance.ts(251,17): error TS2345: Argument of type 'string | string[]' is not assignable to parameter of type 'string'.
  Type 'string[]' is not assignable to type 'string'.
src/routes/governance.ts(278,17): error TS2345: Argument of type 'string | string[]' is not assignable to parameter of type 'string'.
  Type 'string[]' is not assignable to type 'string'.
src/routes/governance.ts(323,9): error TS2322: Type 'number' is not assignable to type 'string'.
src/routes/governance.ts(324,9): error TS2322: Type 'number' is not assignable to type 'string'.
src/routes/governance.ts(331,17): error TS2345: Argument of type 'string | string[]' is not assignable to parameter of type 'string'.
  Type 'string[]' is not assignable to type 'string'.
src/routes/insurance-binder.ts(130,15): error TS2345: Argument of type '{ organization_id: string; evidence_type: string; title: string; description: string | null; file_url: string | null; status: string; coverage_area: string | null; insurance_provider: string | null; policy_number: string | null; expiry_date: string | null; created_by: string; }' is not assignable to parameter of type 'RejectExcessProperties<{ category: string; evidence_description: string; organization_id: string; collected_at?: string | null | undefined; coverage_area?: string | null | undefined; created_at?: string | null | undefined; ... 15 more ...; updated_at?: string | ... 1 more ... | undefined; }, { ...; }> | RejectExcess...'.
  Type '{ organization_id: string; evidence_type: string; title: string; description: string | null; file_url: string | null; status: string; coverage_area: string | null; insurance_provider: string | null; policy_number: string | null; expiry_date: string | null; created_by: string; }' is not assignable to type 'RejectExcessProperties<{ category: string; evidence_description: string; organization_id: string; collected_at?: string | null | undefined; coverage_area?: string | null | undefined; created_at?: string | null | undefined; ... 15 more ...; updated_at?: string | ... 1 more ... | undefined; }, { ...; }>'.
    Type '{ organization_id: string; evidence_type: string; title: string; description: string | null; file_url: string | null; status: string; coverage_area: string | null; insurance_provider: string | null; policy_number: string | null; expiry_date: string | null; created_by: string; }' is missing the following properties from type '{ category: string; evidence_description: string; organization_id: string; collected_at?: string | null | undefined; coverage_area?: string | null | undefined; created_at?: string | null | undefined; ... 15 more ...; updated_at?: string | ... 1 more ... | undefined; }': category, evidence_description
src/routes/insurance-binder.ts(198,15): error TS2345: Argument of type 'Record<string, unknown>' is not assignable to parameter of type 'RejectExcessProperties<{ category?: string | null | undefined; collected_at?: string | null | undefined; coverage_area?: string | null | undefined; created_at?: string | null | undefined; created_by?: string | null | undefined; ... 16 more ...; updated_at?: string | ... 1 more ... | undefined; }, Record<...>>'.
  Type 'Record<string, unknown>' is not assignable to type '{ [x: string]: never; }'.
    'string' index signatures are incompatible.
      Type 'unknown' is not assignable to type 'never'.
src/routes/license-optimizer.ts(146,15): error TS2345: Argument of type 'Record<string, unknown>' is not assignable to parameter of type 'RejectExcessProperties<{ organization_id: string; software_name: string; billing_cycle?: string | null | undefined; cost_per_seat?: number | null | undefined; created_at?: string | null | undefined; created_by?: string | ... 1 more ... | undefined; ... 7 more ...; used_seats?: number | ... 1 more ... | undefined; },...'.
  Type 'Record<string, unknown>' is missing the following properties from type 'RejectExcessProperties<{ organization_id: string; software_name: string; billing_cycle?: string | null | undefined; cost_per_seat?: number | null | undefined; created_at?: string | null | undefined; created_by?: string | ... 1 more ... | undefined; ... 7 more ...; used_seats?: number | ... 1 more ... | undefined; },...': length, pop, push, concat, and 29 more.
src/routes/license-optimizer.ts(174,15): error TS2345: Argument of type 'Record<string, unknown>' is not assignable to parameter of type 'RejectExcessProperties<{ billing_cycle?: string | null | undefined; cost_per_seat?: number | null | undefined; created_at?: string | null | undefined; created_by?: string | null | undefined; id?: string | null | undefined; ... 8 more ...; used_seats?: number | ... 1 more ... | undefined; }, Record<...>>'.
  Type 'Record<string, unknown>' is not assignable to type '{ [x: string]: never; }'.
    'string' index signatures are incompatible.
      Type 'unknown' is not assignable to type 'never'.
src/routes/memberships.ts(32,50): error TS2345: Argument of type 'string' is not assignable to parameter of type 'NonNullable<"pending" | "approved" | "rejected" | "suspended">'.
src/routes/memberships.ts(87,22): error TS2345: Argument of type 'string | null' is not assignable to parameter of type 'string'.
  Type 'null' is not assignable to type 'string'.
src/routes/memberships.ts(98,9): error TS2322: Type 'string | null' is not assignable to type 'string'.
  Type 'null' is not assignable to type 'string'.
src/routes/memberships.ts(135,17): error TS2345: Argument of type 'string | string[]' is not assignable to parameter of type 'string'.
  Type 'string[]' is not assignable to type 'string'.
src/routes/memberships.ts(159,76): error TS2345: Argument of type 'string | string[]' is not assignable to parameter of type 'string'.
  Type 'string[]' is not assignable to type 'string'.
src/routes/notification-preferences.ts(74,13): error TS2322: Type 'string | null' is not assignable to type 'string'.
  Type 'null' is not assignable to type 'string'.
src/routes/organizations.ts(73,50): error TS2345: Argument of type 'string' is not assignable to parameter of type 'NonNullable<"pending" | "approved" | "rejected" | "suspended">'.
src/routes/organizations.ts(96,17): error TS2345: Argument of type 'string | string[]' is not assignable to parameter of type 'string'.
  Type 'string[]' is not assignable to type 'string'.
src/routes/organizations.ts(113,17): error TS2345: Argument of type 'string | string[]' is not assignable to parameter of type 'string'.
  Type 'string[]' is not assignable to type 'string'.
src/routes/organizations.ts(120,81): error TS2345: Argument of type 'string | string[]' is not assignable to parameter of type 'string'.
  Type 'string[]' is not assignable to type 'string'.
src/routes/organizations.ts(126,34): error TS2345: Argument of type 'string | string[]' is not assignable to parameter of type 'string'.
  Type 'string[]' is not assignable to type 'string'.
src/routes/organizations.ts(212,17): error TS2345: Argument of type 'string | string[]' is not assignable to parameter of type 'string'.
  Type 'string[]' is not assignable to type 'string'.
src/routes/organizations.ts(236,15): error TS2345: Argument of type 'Record<string, unknown>' is not assignable to parameter of type 'RejectExcessProperties<{ accent_color?: string | null | undefined; billing_email?: string | null | undefined; brand_color?: string | null | undefined; created_at?: string | null | undefined; created_by?: string | ... 1 more ... | undefined; ... 10 more ...; version?: number | ... 1 more ... | undefined; }, Record<.....'.
  Type 'Record<string, unknown>' is not assignable to type '{ [x: string]: never; }'.
    'string' index signatures are incompatible.
      Type 'unknown' is not assignable to type 'never'.
src/routes/organizations.ts(237,17): error TS2345: Argument of type 'string | string[]' is not assignable to parameter of type 'string'.
  Type 'string[]' is not assignable to type 'string'.
src/routes/organizations.ts(264,78): error TS2345: Argument of type 'string | string[]' is not assignable to parameter of type 'string'.
  Type 'string[]' is not assignable to type 'string'.
src/routes/organizations.ts(287,30): error TS2345: Argument of type 'string | string[]' is not assignable to parameter of type 'string'.
  Type 'string[]' is not assignable to type 'string'.
src/routes/organizations.ts(304,9): error TS2322: Type 'string | string[]' is not assignable to type 'string'.
  Type 'string[]' is not assignable to type 'string'.
src/routes/organizations.ts(335,17): error TS2345: Argument of type 'string | string[]' is not assignable to parameter of type 'string'.
  Type 'string[]' is not assignable to type 'string'.
src/routes/organizations.ts(336,30): error TS2345: Argument of type 'string | string[]' is not assignable to parameter of type 'string'.
  Type 'string[]' is not assignable to type 'string'.
src/routes/organizations.ts(364,17): error TS2345: Argument of type 'string | string[]' is not assignable to parameter of type 'string'.
  Type 'string[]' is not assignable to type 'string'.
src/routes/organizations.ts(365,30): error TS2345: Argument of type 'string | string[]' is not assignable to parameter of type 'string'.
  Type 'string[]' is not assignable to type 'string'.
src/routes/organizations.ts(415,19): error TS2345: Argument of type 'string | string[]' is not assignable to parameter of type 'string'.
  Type 'string[]' is not assignable to type 'string'.
src/routes/profiles.ts(118,17): error TS2345: Argument of type 'string | string[]' is not assignable to parameter of type 'string'.
  Type 'string[]' is not assignable to type 'string'.
src/routes/profiles.ts(136,15): error TS2345: Argument of type 'Record<string, unknown>' is not assignable to parameter of type 'RejectExcessProperties<{ avatar_url?: string | null | undefined; created_at?: string | null | undefined; default_organization_id?: string | null | undefined; email?: string | null | undefined; full_name?: string | ... 1 more ... | undefined; ... 6 more ...; version?: number | ... 1 more ... | undefined; }, Record<.....'.
  Type 'Record<string, unknown>' is not assignable to type '{ [x: string]: never; }'.
    'string' index signatures are incompatible.
      Type 'unknown' is not assignable to type 'never'.
src/routes/profiles.ts(138,17): error TS2345: Argument of type 'string | string[]' is not assignable to parameter of type 'string'.
  Type 'string[]' is not assignable to type 'string'.
src/routes/projects.ts(59,50): error TS2345: Argument of type 'string' is not assignable to parameter of type 'NonNullable<"blocked" | "planned" | "active" | "client_review" | "completed" | "archived">'.
src/routes/projects.ts(84,50): error TS2345: Argument of type 'string' is not assignable to parameter of type 'NonNullable<"blocked" | "planned" | "active" | "client_review" | "completed" | "archived">'.
src/routes/projects.ts(254,30): error TS2353: Object literal may only specify known properties, and 'project_id' does not exist in type 'never[]'.
src/routes/projects.ts(265,24): error TS2339: Property 'id' does not exist on type 'never'.
src/routes/projects.ts(288,38): error TS2339: Property 'project_id' does not exist on type 'never'.
src/routes/projects.ts(296,17): error TS2345: Argument of type 'Record<string, unknown>' is not assignable to parameter of type 'never'.
src/routes/projects.ts(321,38): error TS2339: Property 'project_id' does not exist on type 'never'.
src/routes/projects.ts(385,32): error TS2345: Argument of type 'string | undefined' is not assignable to parameter of type 'string'.
  Type 'undefined' is not assignable to type 'string'.
src/routes/projects.ts(401,32): error TS2345: Argument of type 'string | undefined' is not assignable to parameter of type 'string'.
  Type 'undefined' is not assignable to type 'string'.
src/routes/projects.ts(465,15): error TS2345: Argument of type '{ organization_id: string; name: string; description: string | null; status: "blocked" | "planned" | "active" | "client_review" | "completed" | "archived"; priority: "low" | "normal" | "high" | "urgent"; starts_at: string | null; due_at: string | null; external_jira_project_key: string | null; }' is not assignable to parameter of type 'RejectExcessProperties<{ created_by: string; name: string; organization_id: string; created_at?: string | null | undefined; deleted_at?: string | null | undefined; deleted_by?: string | null | undefined; ... 14 more ...; version?: number | ... 1 more ... | undefined; }, { ...; }> | RejectExcessProperties<...>[]'.
  Type '{ organization_id: string; name: string; description: string | null; status: "blocked" | "planned" | "active" | "client_review" | "completed" | "archived"; priority: "low" | "normal" | "high" | "urgent"; starts_at: string | null; due_at: string | null; external_jira_project_key: string | null; }' is not assignable to type 'RejectExcessProperties<{ created_by: string; name: string; organization_id: string; created_at?: string | null | undefined; deleted_at?: string | null | undefined; deleted_by?: string | null | undefined; description?: string | ... 1 more ... | undefined; ... 13 more ...; version?: number | ... 1 more ... | undefined...'.
    Property 'created_by' is missing in type '{ organization_id: string; name: string; description: string | null; status: "blocked" | "planned" | "active" | "client_review" | "completed" | "archived"; priority: "low" | "normal" | "high" | "urgent"; starts_at: string | null; due_at: string | null; external_jira_project_key: string | null; }' but required in type '{ created_by: string; name: string; organization_id: string; created_at?: string | null | undefined; deleted_at?: string | null | undefined; deleted_by?: string | null | undefined; description?: string | ... 1 more ... | undefined; ... 13 more ...; version?: number | ... 1 more ... | undefined; }'.
src/routes/projects.ts(509,77): error TS2345: Argument of type 'string | string[]' is not assignable to parameter of type 'string'.
  Type 'string[]' is not assignable to type 'string'.
src/routes/projects.ts(533,15): error TS2345: Argument of type 'Record<string, unknown>' is not assignable to parameter of type 'RejectExcessProperties<{ created_at?: string | null | undefined; created_by?: string | null | undefined; deleted_at?: string | null | undefined; deleted_by?: string | null | undefined; description?: string | null | undefined; ... 15 more ...; version?: number | ... 1 more ... | undefined; }, Record<...>>'.
  Type 'Record<string, unknown>' is not assignable to type '{ [x: string]: never; }'.
    'string' index signatures are incompatible.
      Type 'unknown' is not assignable to type 'never'.
src/routes/projects.ts(534,17): error TS2345: Argument of type 'string | string[]' is not assignable to parameter of type 'string'.
  Type 'string[]' is not assignable to type 'string'.
src/routes/projects.ts(562,17): error TS2345: Argument of type 'string | string[]' is not assignable to parameter of type 'string'.
  Type 'string[]' is not assignable to type 'string'.
src/routes/projects.ts(567,73): error TS2345: Argument of type 'string | string[]' is not assignable to parameter of type 'string'.
  Type 'string[]' is not assignable to type 'string'.
src/routes/projects.ts(615,15): error TS2345: Argument of type '{ project_id: string; title: string; description: string | null; details: string | null; status: "todo" | "in_progress" | "in_review" | "blocked" | "done"; sort_order: number; due_at: string | null; ... 9 more ...; sprint: string | null; }' is not assignable to parameter of type 'RejectExcessProperties<{ created_by: string; organization_id: string; project_id: string; title: string; actual_hours?: number | null | undefined; approval_required?: boolean | null | undefined; approved_at?: string | ... 1 more ... | undefined; ... 22 more ...; version?: number | ... 1 more ... | undefined; }, { .....'.
  Type '{ project_id: string; title: string; description: string | null; details: string | null; status: "todo" | "in_progress" | "in_review" | "blocked" | "done"; sort_order: number; due_at: string | null; ... 9 more ...; sprint: string | null; }' is not assignable to type 'RejectExcessProperties<{ created_by: string; organization_id: string; project_id: string; title: string; actual_hours?: number | null | undefined; approval_required?: boolean | null | undefined; approved_at?: string | ... 1 more ... | undefined; ... 22 more ...; version?: number | ... 1 more ... | undefined; }, { .....'.
    Type '{ project_id: string; title: string; description: string | null; details: string | null; status: "todo" | "in_progress" | "in_review" | "blocked" | "done"; sort_order: number; due_at: string | null; ... 9 more ...; sprint: string | null; }' is missing the following properties from type '{ created_by: string; organization_id: string; project_id: string; title: string; actual_hours?: number | null | undefined; approval_required?: boolean | null | undefined; approved_at?: string | ... 1 more ... | undefined; ... 22 more ...; version?: number | ... 1 more ... | undefined; }': created_by, organization_id
src/routes/projects.ts(665,17): error TS2345: Argument of type 'string | string[]' is not assignable to parameter of type 'string'.
  Type 'string[]' is not assignable to type 'string'.
src/routes/projects.ts(700,15): error TS2345: Argument of type 'Record<string, unknown>' is not assignable to parameter of type 'RejectExcessProperties<{ actual_hours?: number | null | undefined; approval_required?: boolean | null | undefined; approved_at?: string | null | undefined; approved_by?: string | null | undefined; created_at?: string | ... 1 more ... | undefined; ... 24 more ...; version?: number | ... 1 more ... | undefined; }, Rec...'.
  Type 'Record<string, unknown>' is not assignable to type '{ [x: string]: never; }'.
    'string' index signatures are incompatible.
      Type 'unknown' is not assignable to type 'never'.
src/routes/projects.ts(702,17): error TS2345: Argument of type 'string | string[]' is not assignable to parameter of type 'string'.
  Type 'string[]' is not assignable to type 'string'.
src/routes/projects.ts(703,25): error TS2345: Argument of type 'string | string[]' is not assignable to parameter of type 'string'.
  Type 'string[]' is not assignable to type 'string'.
src/routes/projects.ts(800,15): error TS2345: Argument of type '{ task_id: string; author_id: string; body: string; is_internal: boolean; }' is not assignable to parameter of type 'RejectExcessProperties<{ author_id: string; body: string; organization_id: string; project_id: string; task_id: string; created_at?: string | null | undefined; id?: string | null | undefined; is_internal?: boolean | null | undefined; }, { ...; }> | RejectExcessProperties<...>[]'.
  Type '{ task_id: string; author_id: string; body: string; is_internal: boolean; }' is not assignable to type 'RejectExcessProperties<{ author_id: string; body: string; organization_id: string; project_id: string; task_id: string; created_at?: string | null | undefined; id?: string | null | undefined; is_internal?: boolean | null | undefined; }, { ...; }>'.
    Type '{ task_id: string; author_id: string; body: string; is_internal: boolean; }' is missing the following properties from type '{ author_id: string; body: string; organization_id: string; project_id: string; task_id: string; created_at?: string | null | undefined; id?: string | null | undefined; is_internal?: boolean | null | undefined; }': organization_id, project_id
src/routes/projects.ts(856,15): error TS2345: Argument of type '{ project_id: string; author_id: string; body: string; is_internal: boolean; is_pinned: boolean; }' is not assignable to parameter of type 'RejectExcessProperties<{ author_id: string; body: string; organization_id: string; project_id: string; created_at?: string | null | undefined; id?: string | null | undefined; is_internal?: boolean | null | undefined; is_pinned?: boolean | ... 1 more ... | undefined; updated_at?: string | ... 1 more ... | undefined; ...'.
  Type '{ project_id: string; author_id: string; body: string; is_internal: boolean; is_pinned: boolean; }' is not assignable to type 'RejectExcessProperties<{ author_id: string; body: string; organization_id: string; project_id: string; created_at?: string | null | undefined; id?: string | null | undefined; is_internal?: boolean | null | undefined; is_pinned?: boolean | ... 1 more ... | undefined; updated_at?: string | ... 1 more ... | undefined; ...'.
    Property 'organization_id' is missing in type '{ project_id: string; author_id: string; body: string; is_internal: boolean; is_pinned: boolean; }' but required in type '{ author_id: string; body: string; organization_id: string; project_id: string; created_at?: string | null | undefined; id?: string | null | undefined; is_internal?: boolean | null | undefined; is_pinned?: boolean | ... 1 more ... | undefined; updated_at?: string | ... 1 more ... | undefined; }'.
src/routes/projects.ts(898,15): error TS2345: Argument of type 'Record<string, unknown>' is not assignable to parameter of type 'RejectExcessProperties<{ author_id?: string | null | undefined; body?: string | null | undefined; created_at?: string | null | undefined; id?: string | null | undefined; is_internal?: boolean | null | undefined; is_pinned?: boolean | ... 1 more ... | undefined; organization_id?: string | ... 1 more ... | undefined; ...'.
  Type 'Record<string, unknown>' is not assignable to type '{ [x: string]: never; }'.
    'string' index signatures are incompatible.
      Type 'unknown' is not assignable to type 'never'.
src/routes/projects.ts(965,15): error TS2345: Argument of type 'Record<string, unknown>' is not assignable to parameter of type 'RejectExcessProperties<{ author_id?: string | null | undefined; body?: string | null | undefined; created_at?: string | null | undefined; id?: string | null | undefined; is_internal?: boolean | null | undefined; organization_id?: string | ... 1 more ... | undefined; project_id?: string | ... 1 more ... | undefined; ...'.
  Type 'Record<string, unknown>' is not assignable to type '{ [x: string]: never; }'.
    'string' index signatures are incompatible.
      Type 'unknown' is not assignable to type 'never'.
src/routes/projects.ts(1094,60): error TS2345: Argument of type '{ p_user_id: string; p_task_id: string; p_organization_id: string; }' is not assignable to parameter of type 'undefined'.
src/routes/projects.ts(1126,66): error TS2345: Argument of type '{ p_task_id: string; p_organization_id: string; p_user_id: string; }' is not assignable to parameter of type 'undefined'.
src/routes/projects.ts(1158,70): error TS2345: Argument of type '{ p_task_id: string; p_organization_id: string; p_body: string; p_user_id: string; }' is not assignable to parameter of type 'undefined'.
src/routes/proposals.ts(160,9): error TS2322: Type 'Record<string, unknown>' is not assignable to type 'Json | undefined'.
  Type 'Record<string, unknown>' is missing the following properties from type 'Json[]': length, pop, push, concat, and 29 more.
src/routes/proposals.ts(270,17): error TS2345: Argument of type 'string | string[]' is not assignable to parameter of type 'string'.
  Type 'string[]' is not assignable to type 'string'.
src/routes/proposals.ts(288,15): error TS2345: Argument of type 'Record<string, unknown>' is not assignable to parameter of type 'RejectExcessProperties<{ approval_request_id?: string | null | undefined; approved_at?: string | null | undefined; approved_by?: string | null | undefined; created_at?: string | null | undefined; created_by?: string | ... 1 more ... | undefined; ... 19 more ...; visibility?: string | ... 1 more ... | undefined; }, R...'.
  Type 'Record<string, unknown>' is not assignable to type '{ [x: string]: never; }'.
    'string' index signatures are incompatible.
      Type 'unknown' is not assignable to type 'never'.
src/routes/proposals.ts(289,17): error TS2345: Argument of type 'string | string[]' is not assignable to parameter of type 'string'.
  Type 'string[]' is not assignable to type 'string'.
src/routes/proposals.ts(378,15): error TS2345: Argument of type 'Record<string, unknown>' is not assignable to parameter of type 'RejectExcessProperties<{ assumptions?: string | null | undefined; created_at?: string | null | undefined; description?: string | null | undefined; id?: string | null | undefined; notes?: string | null | undefined; proposal_id?: string | ... 1 more ... | undefined; sort_order?: number | ... 1 more ... | undefined; ti...'.
  Type 'Record<string, unknown>' is not assignable to type '{ [x: string]: never; }'.
    'string' index signatures are incompatible.
      Type 'unknown' is not assignable to type 'never'.
src/routes/proposals.ts(492,15): error TS2345: Argument of type 'Record<string, unknown>' is not assignable to parameter of type 'RejectExcessProperties<{ created_at?: string | null | undefined; description?: string | null | undefined; id?: string | null | undefined; is_optional?: boolean | null | undefined; is_recurring?: boolean | null | undefined; ... 10 more ...; updated_at?: string | ... 1 more ... | undefined; }, Record<...>>'.
  Type 'Record<string, unknown>' is not assignable to type '{ [x: string]: never; }'.
    'string' index signatures are incompatible.
      Type 'unknown' is not assignable to type 'never'.
src/routes/qbr.ts(175,9): error TS2322: Type 'Record<string, unknown>' is not assignable to type 'Json | undefined'.
  Type 'Record<string, unknown>' is missing the following properties from type 'Json[]': length, pop, push, concat, and 29 more.
src/routes/qbr.ts(211,15): error TS2345: Argument of type 'Record<string, unknown>' is not assignable to parameter of type 'RejectExcessProperties<{ approved_at?: string | null | undefined; approved_by?: string | null | undefined; created_at?: string | null | undefined; created_by?: string | null | undefined; generated_at?: string | ... 1 more ... | undefined; ... 12 more ...; visibility?: string | ... 1 more ... | undefined; }, Record<....'.
  Type 'Record<string, unknown>' is not assignable to type '{ [x: string]: never; }'.
    'string' index signatures are incompatible.
      Type 'unknown' is not assignable to type 'never'.
src/routes/roles.ts(146,17): error TS2345: Argument of type 'string | string[]' is not assignable to parameter of type 'string'.
  Type 'string[]' is not assignable to type 'string'.
src/routes/roles.ts(156,15): error TS2345: Argument of type 'Record<string, unknown>' is not assignable to parameter of type 'RejectExcessProperties<{ created_at?: string | null | undefined; description?: string | null | undefined; id?: string | null | undefined; is_system?: boolean | null | undefined; key?: string | null | undefined; name?: string | ... 1 more ... | undefined; }, Record<...>>'.
  Type 'Record<string, unknown>' is not assignable to type '{ [x: string]: never; }'.
    'string' index signatures are incompatible.
      Type 'unknown' is not assignable to type 'never'.
src/routes/roles.ts(157,17): error TS2345: Argument of type 'string | string[]' is not assignable to parameter of type 'string'.
  Type 'string[]' is not assignable to type 'string'.
src/routes/roles.ts(191,17): error TS2345: Argument of type 'string | string[]' is not assignable to parameter of type 'string'.
  Type 'string[]' is not assignable to type 'string'.
src/routes/roles.ts(198,70): error TS2345: Argument of type 'string | string[]' is not assignable to parameter of type 'string'.
  Type 'string[]' is not assignable to type 'string'.
src/routes/roles.ts(223,65): error TS2345: Argument of type 'string | string[]' is not assignable to parameter of type 'string'.
  Type 'string[]' is not assignable to type 'string'.
src/routes/roles.ts(229,81): error TS2345: Argument of type 'string | string[]' is not assignable to parameter of type 'string'.
  Type 'string[]' is not assignable to type 'string'.
src/routes/roles.ts(260,17): error TS2345: Argument of type 'string | string[]' is not assignable to parameter of type 'string'.
  Type 'string[]' is not assignable to type 'string'.
src/routes/roles.ts(270,11): error TS2322: Type 'string | string[]' is not assignable to type 'string'.
  Type 'string[]' is not assignable to type 'string'.
src/routes/roles.ts(279,24): error TS2345: Argument of type 'string | string[]' is not assignable to parameter of type 'string'.
  Type 'string[]' is not assignable to type 'string'.
src/routes/security-ops.ts(72,59): error TS2345: Argument of type 'Record<string, unknown>' is not assignable to parameter of type 'never[]'.
  Type 'Record<string, unknown>' is missing the following properties from type 'never[]': length, pop, push, concat, and 29 more.
src/routes/security-ops.ts(79,24): error TS2339: Property 'id' does not exist on type 'never'.
src/routes/security-ops.ts(97,17): error TS2345: Argument of type 'Record<string, unknown>' is not assignable to parameter of type 'never'.
src/routes/security-ops.ts(108,24): error TS2339: Property 'id' does not exist on type 'never'.
src/routes/security-ops.ts(203,7): error TS2769: No overload matches this call.
  Overload 1 of 3, '(callbackfn: (previousValue: { compliance_pct: number | null; created_at: string; created_by: string | null; critical_patches: number; device_group: string; exception_count: number; id: string; last_checked_at: string | null; ... 8 more ...; updated_at: string; }, currentValue: { ...; }, currentIndex: number, array: { ...; }[]) => { ...; }, initialValue: { ...; }): { ...; }', gave the following error.
    Argument of type '(s: number, i: Record<string, number>) => number' is not assignable to parameter of type '(previousValue: { compliance_pct: number | null; created_at: string; created_by: string | null; critical_patches: number; device_group: string; exception_count: number; id: string; last_checked_at: string | null; ... 8 more ...; updated_at: string; }, currentValue: { ...; }, currentIndex: number, array: { ...; }[]) ...'.
      Types of parameters 's' and 'previousValue' are incompatible.
        Type '{ compliance_pct: number | null; created_at: string; created_by: string | null; critical_patches: number; device_group: string; exception_count: number; id: string; last_checked_at: string | null; ... 8 more ...; updated_at: string; }' is not assignable to type 'number'.
  Overload 2 of 3, '(callbackfn: (previousValue: number, currentValue: { compliance_pct: number | null; created_at: string; created_by: string | null; critical_patches: number; device_group: string; exception_count: number; ... 10 more ...; updated_at: string; }, currentIndex: number, array: { ...; }[]) => number, initialValue: number): number', gave the following error.
    Argument of type '(s: number, i: Record<string, number>) => number' is not assignable to parameter of type '(previousValue: number, currentValue: { compliance_pct: number | null; created_at: string; created_by: string | null; critical_patches: number; device_group: string; exception_count: number; id: string; ... 9 more ...; updated_at: string; }, currentIndex: number, array: { ...; }[]) => number'.
      Types of parameters 'i' and 'currentValue' are incompatible.
        Type '{ compliance_pct: number | null; created_at: string; created_by: string | null; critical_patches: number; device_group: string; exception_count: number; id: string; last_checked_at: string | null; ... 8 more ...; updated_at: string; }' is not assignable to type 'Record<string, number>'.
          Property 'compliance_pct' is incompatible with index signature.
            Type 'number | null' is not assignable to type 'number'.
              Type 'null' is not assignable to type 'number'.
src/routes/security-ops.ts(207,7): error TS2769: No overload matches this call.
  Overload 1 of 3, '(callbackfn: (previousValue: { compliance_pct: number | null; created_at: string; created_by: string | null; critical_patches: number; device_group: string; exception_count: number; id: string; last_checked_at: string | null; ... 8 more ...; updated_at: string; }, currentValue: { ...; }, currentIndex: number, array: { ...; }[]) => { ...; }, initialValue: { ...; }): { ...; }', gave the following error.
    Argument of type '(s: number, i: Record<string, number>) => number' is not assignable to parameter of type '(previousValue: { compliance_pct: number | null; created_at: string; created_by: string | null; critical_patches: number; device_group: string; exception_count: number; id: string; last_checked_at: string | null; ... 8 more ...; updated_at: string; }, currentValue: { ...; }, currentIndex: number, array: { ...; }[]) ...'.
      Types of parameters 's' and 'previousValue' are incompatible.
        Type '{ compliance_pct: number | null; created_at: string; created_by: string | null; critical_patches: number; device_group: string; exception_count: number; id: string; last_checked_at: string | null; ... 8 more ...; updated_at: string; }' is not assignable to type 'number'.
  Overload 2 of 3, '(callbackfn: (previousValue: number, currentValue: { compliance_pct: number | null; created_at: string; created_by: string | null; critical_patches: number; device_group: string; exception_count: number; ... 10 more ...; updated_at: string; }, currentIndex: number, array: { ...; }[]) => number, initialValue: number): number', gave the following error.
    Argument of type '(s: number, i: Record<string, number>) => number' is not assignable to parameter of type '(previousValue: number, currentValue: { compliance_pct: number | null; created_at: string; created_by: string | null; critical_patches: number; device_group: string; exception_count: number; id: string; ... 9 more ...; updated_at: string; }, currentIndex: number, array: { ...; }[]) => number'.
      Types of parameters 'i' and 'currentValue' are incompatible.
        Type '{ compliance_pct: number | null; created_at: string; created_by: string | null; critical_patches: number; device_group: string; exception_count: number; id: string; last_checked_at: string | null; ... 8 more ...; updated_at: string; }' is not assignable to type 'Record<string, number>'.
          Property 'compliance_pct' is incompatible with index signature.
            Type 'number | null' is not assignable to type 'number'.
              Type 'null' is not assignable to type 'number'.
src/routes/security-ops.ts(211,7): error TS2769: No overload matches this call.
  Overload 1 of 3, '(callbackfn: (previousValue: { compliance_pct: number | null; created_at: string; created_by: string | null; critical_patches: number; device_group: string; exception_count: number; id: string; last_checked_at: string | null; ... 8 more ...; updated_at: string; }, currentValue: { ...; }, currentIndex: number, array: { ...; }[]) => { ...; }, initialValue: { ...; }): { ...; }', gave the following error.
    Argument of type '(s: number, i: Record<string, number>) => number' is not assignable to parameter of type '(previousValue: { compliance_pct: number | null; created_at: string; created_by: string | null; critical_patches: number; device_group: string; exception_count: number; id: string; last_checked_at: string | null; ... 8 more ...; updated_at: string; }, currentValue: { ...; }, currentIndex: number, array: { ...; }[]) ...'.
      Types of parameters 's' and 'previousValue' are incompatible.
        Type '{ compliance_pct: number | null; created_at: string; created_by: string | null; critical_patches: number; device_group: string; exception_count: number; id: string; last_checked_at: string | null; ... 8 more ...; updated_at: string; }' is not assignable to type 'number'.
  Overload 2 of 3, '(callbackfn: (previousValue: number, currentValue: { compliance_pct: number | null; created_at: string; created_by: string | null; critical_patches: number; device_group: string; exception_count: number; ... 10 more ...; updated_at: string; }, currentIndex: number, array: { ...; }[]) => number, initialValue: number): number', gave the following error.
    Argument of type '(s: number, i: Record<string, number>) => number' is not assignable to parameter of type '(previousValue: number, currentValue: { compliance_pct: number | null; created_at: string; created_by: string | null; critical_patches: number; device_group: string; exception_count: number; id: string; ... 9 more ...; updated_at: string; }, currentIndex: number, array: { ...; }[]) => number'.
      Types of parameters 'i' and 'currentValue' are incompatible.
        Type '{ compliance_pct: number | null; created_at: string; created_by: string | null; critical_patches: number; device_group: string; exception_count: number; id: string; last_checked_at: string | null; ... 8 more ...; updated_at: string; }' is not assignable to type 'Record<string, number>'.
          Property 'compliance_pct' is incompatible with index signature.
            Type 'number | null' is not assignable to type 'number'.
              Type 'null' is not assignable to type 'number'.
src/routes/security-ops.ts(220,25): error TS2365: Operator '>' cannot be applied to types '{ compliance_pct: number | null; created_at: string; created_by: string | null; critical_patches: number; device_group: string; exception_count: number; id: string; last_checked_at: string | null; ... 8 more ...; updated_at: string; }' and 'number'.
src/routes/security-ops.ts(220,56): error TS2362: The left-hand side of an arithmetic operation must be of type 'any', 'number', 'bigint' or an enum type.
src/routes/security-ops.ts(220,66): error TS2363: The right-hand side of an arithmetic operation must be of type 'any', 'number', 'bigint' or an enum type.
src/routes/security-suite.ts(72,59): error TS2345: Argument of type 'Record<string, unknown>' is not assignable to parameter of type 'never[]'.
  Type 'Record<string, unknown>' is missing the following properties from type 'never[]': length, pop, push, concat, and 29 more.
src/routes/security-suite.ts(79,24): error TS2339: Property 'id' does not exist on type 'never'.
src/routes/security-suite.ts(97,17): error TS2345: Argument of type 'Record<string, unknown>' is not assignable to parameter of type 'never'.
src/routes/security-suite.ts(108,24): error TS2339: Property 'id' does not exist on type 'never'.
src/routes/service-catalog.ts(115,15): error TS2345: Argument of type 'Record<string, unknown>' is not assignable to parameter of type 'RejectExcessProperties<{ base_price?: number | null | undefined; billing_model?: string | null | undefined; bundle_id?: string | null | undefined; category?: string | null | undefined; created_at?: string | null | undefined; ... 13 more ...; visibility?: string | ... 1 more ... | undefined; }, Record<...>>'.
  Type 'Record<string, unknown>' is not assignable to type '{ [x: string]: never; }'.
    'string' index signatures are incompatible.
      Type 'unknown' is not assignable to type 'never'.
src/routes/status-page.ts(140,65): error TS2345: Argument of type 'Record<string, unknown>' is not assignable to parameter of type 'never[]'.
  Type 'Record<string, unknown>' is missing the following properties from type 'never[]': length, pop, push, concat, and 29 more.
src/routes/status-page.ts(147,24): error TS2339: Property 'id' does not exist on type 'never'.
src/routes/status-page.ts(165,17): error TS2345: Argument of type 'Record<string, unknown>' is not assignable to parameter of type 'never'.
src/routes/store.ts(151,15): error TS2345: Argument of type 'Record<string, unknown>' is not assignable to parameter of type 'RejectExcessProperties<{ badge_text?: string | null | undefined; created_at?: string | null | undefined; detail_text?: string | null | undefined; eligibility_targets?: string[] | null | undefined; end_date?: string | ... 1 more ... | undefined; ... 6 more ...; updated_at?: string | ... 1 more ... | undefined; }, Rec...'.
  Type 'Record<string, unknown>' is not assignable to type '{ [x: string]: never; }'.
    'string' index signatures are incompatible.
      Type 'unknown' is not assignable to type 'never'.
src/routes/store.ts(152,17): error TS2345: Argument of type 'string | string[]' is not assignable to parameter of type 'string'.
  Type 'string[]' is not assignable to type 'string'.
src/routes/store.ts(176,17): error TS2345: Argument of type 'string | string[]' is not assignable to parameter of type 'string'.
  Type 'string[]' is not assignable to type 'string'.
src/routes/tickets.ts(54,50): error TS2345: Argument of type 'string' is not assignable to parameter of type 'NonNullable<"closed" | "in_progress" | "new" | "triaged" | "waiting_on_client" | "resolved">'.
src/routes/tickets.ts(79,50): error TS2345: Argument of type 'string' is not assignable to parameter of type 'NonNullable<"closed" | "in_progress" | "new" | "triaged" | "waiting_on_client" | "resolved">'.
src/routes/tickets.ts(177,13): error TS2322: Type 'string | null' is not assignable to type 'string'.
  Type 'null' is not assignable to type 'string'.
src/routes/tickets.ts(201,76): error TS2345: Argument of type 'string | string[]' is not assignable to parameter of type 'string'.
  Type 'string[]' is not assignable to type 'string'.
src/routes/tickets.ts(227,15): error TS2345: Argument of type 'Record<string, unknown>' is not assignable to parameter of type 'RejectExcessProperties<{ assigned_to?: string | null | undefined; category?: string | null | undefined; created_at?: string | null | undefined; created_by?: string | null | undefined; deleted_at?: string | null | undefined; ... 14 more ...; version?: number | ... 1 more ... | undefined; }, Record<...>>'.
  Type 'Record<string, unknown>' is not assignable to type '{ [x: string]: never; }'.
    'string' index signatures are incompatible.
      Type 'unknown' is not assignable to type 'never'.
src/routes/tickets.ts(228,17): error TS2345: Argument of type 'string | string[]' is not assignable to parameter of type 'string'.
  Type 'string[]' is not assignable to type 'string'.
src/routes/tickets.ts(253,11): error TS2322: Type 'string | null' is not assignable to type 'string'.
  Type 'null' is not assignable to type 'string'.
src/routes/tickets.ts(260,11): error TS2322: Type 'string | null' is not assignable to type 'string'.
  Type 'null' is not assignable to type 'string'.
src/routes/tickets.ts(340,17): error TS2769: No overload matches this call.
  Overload 1 of 2, '(predicate: (value: string | null, index: number, array: (string | null)[]) => value is string | null, thisArg?: any): (string | null)[]', gave the following error.
    Argument of type '(id: string) => boolean' is not assignable to parameter of type '(value: string | null, index: number, array: (string | null)[]) => value is string | null'.
      Types of parameters 'id' and 'value' are incompatible.
        Type 'string | null' is not assignable to type 'string'.
          Type 'null' is not assignable to type 'string'.
  Overload 2 of 2, '(predicate: (value: string | null, index: number, array: (string | null)[]) => unknown, thisArg?: any): (string | null)[]', gave the following error.
    Argument of type '(id: string) => boolean' is not assignable to parameter of type '(value: string | null, index: number, array: (string | null)[]) => unknown'.
      Types of parameters 'id' and 'value' are incompatible.
        Type 'string | null' is not assignable to type 'string'.
          Type 'null' is not assignable to type 'string'.
src/routes/tickets.ts(350,13): error TS2322: Type 'string | null' is not assignable to type 'string'.
  Type 'null' is not assignable to type 'string'.
src/routes/tickets.ts(357,13): error TS2322: Type 'string | null' is not assignable to type 'string'.
  Type 'null' is not assignable to type 'string'.
src/routes/tickets.ts(464,17): error TS2345: Argument of type 'string | string[]' is not assignable to parameter of type 'string'.
  Type 'string[]' is not assignable to type 'string'.
src/routes/tickets.ts(470,66): error TS2345: Argument of type 'string | string[]' is not assignable to parameter of type 'string'.
  Type 'string[]' is not assignable to type 'string'.
src/routes/tickets.ts(503,85): error TS2345: Argument of type '{ table_name: string; updates: { id: string; data: Record<string, string>; }[]; }' is not assignable to parameter of type 'undefined'.
src/routes/tickets.ts(515,32): error TS2339: Property 'filter' does not exist on type 'never'.
src/routes/tickets.ts(516,28): error TS2339: Property 'filter' does not exist on type 'never'.
src/routes/training-hub.ts(163,15): error TS2345: Argument of type 'Record<string, unknown>' is not assignable to parameter of type 'RejectExcessProperties<{ category?: string | null | undefined; created_at?: string | null | undefined; created_by?: string | null | undefined; description?: string | null | undefined; difficulty?: string | null | undefined; ... 6 more ...; updated_at?: string | ... 1 more ... | undefined; }, Record<...>>'.
  Type 'Record<string, unknown>' is not assignable to type '{ [x: string]: never; }'.
    'string' index signatures are incompatible.
      Type 'unknown' is not assignable to type 'never'.
src/routes/training-hub.ts(362,15): error TS2345: Argument of type 'Record<string, unknown>' is not assignable to parameter of type 'RejectExcessProperties<{ content?: string | null | undefined; course_id?: string | null | undefined; created_at?: string | null | undefined; id?: string | null | undefined; lesson_type?: string | null | undefined; sort_order?: number | ... 1 more ... | undefined; title?: string | ... 1 more ... | undefined; }, Recor...'.
  Type 'Record<string, unknown>' is not assignable to type '{ [x: string]: never; }'.
    'string' index signatures are incompatible.
      Type 'unknown' is not assignable to type 'never'.
src/routes/uptime-monitor.ts(203,15): error TS2345: Argument of type 'Record<string, unknown>' is not assignable to parameter of type 'RejectExcessProperties<{ check_interval_minutes?: number | null | undefined; check_type?: string | null | undefined; created_at?: string | null | undefined; created_by?: string | null | undefined; expected_status_code?: number | ... 1 more ... | undefined; ... 7 more ...; url?: string | ... 1 more ... | undefined; }...'.
  Type 'Record<string, unknown>' is not assignable to type '{ [x: string]: never; }'.
    'string' index signatures are incompatible.
      Type 'unknown' is not assignable to type 'never'.
src/routes/users.ts(186,22): error TS2345: Argument of type '(string | null)[]' is not assignable to parameter of type 'readonly string[]'.
  Type 'string | null' is not assignable to type 'string'.
    Type 'null' is not assignable to type 'string'.
src/routes/users.ts(227,49): error TS2345: Argument of type 'string | null' is not assignable to parameter of type 'string'.
  Type 'null' is not assignable to type 'string'.
src/routes/users.ts(312,17): error TS2345: Argument of type 'string | string[]' is not assignable to parameter of type 'string'.
  Type 'string[]' is not assignable to type 'string'.
src/routes/users.ts(322,22): error TS2345: Argument of type 'string | string[]' is not assignable to parameter of type 'string'.
  Type 'string[]' is not assignable to type 'string'.
src/routes/users.ts(400,22): error TS2345: Argument of type 'string | string[]' is not assignable to parameter of type 'string'.
  Type 'string[]' is not assignable to type 'string'.
src/routes/users.ts(436,24): error TS2345: Argument of type 'string | string[]' is not assignable to parameter of type 'string'.
  Type 'string[]' is not assignable to type 'string'.
src/routes/users.ts(445,24): error TS2345: Argument of type 'string | string[]' is not assignable to parameter of type 'string'.
  Type 'string[]' is not assignable to type 'string'.
src/routes/users.ts(493,22): error TS2345: Argument of type 'string | string[]' is not assignable to parameter of type 'string'.
  Type 'string[]' is not assignable to type 'string'.
src/routes/users.ts(517,9): error TS2322: Type 'string | string[]' is not assignable to type 'string'.
  Type 'string[]' is not assignable to type 'string'.
src/routes/vendors.ts(81,65): error TS2345: Argument of type 'Record<string, unknown>' is not assignable to parameter of type 'never[]'.
  Type 'Record<string, unknown>' is missing the following properties from type 'never[]': length, pop, push, concat, and 29 more.
src/routes/vendors.ts(89,24): error TS2339: Property 'id' does not exist on type 'never'.
src/routes/vendors.ts(109,17): error TS2345: Argument of type 'Record<string, unknown>' is not assignable to parameter of type 'never'.
src/routes/vendors.ts(121,24): error TS2339: Property 'id' does not exist on type 'never'.
src/routes/webhook-management.ts(129,17): error TS2345: Argument of type 'string | string[]' is not assignable to parameter of type 'string'.
  Type 'string[]' is not assignable to type 'string'.
src/routes/webhook-management.ts(149,15): error TS2345: Argument of type 'Record<string, unknown>' is not assignable to parameter of type 'RejectExcessProperties<{ created_at?: string | null | undefined; created_by?: string | null | undefined; events?: string[] | null | undefined; id?: string | null | undefined; is_active?: boolean | null | undefined; ... 8 more ...; version?: number | ... 1 more ... | undefined; }, Record<...>>'.
  Type 'Record<string, unknown>' is not assignable to type '{ [x: string]: never; }'.
    'string' index signatures are incompatible.
      Type 'unknown' is not assignable to type 'never'.
src/routes/webhook-management.ts(151,17): error TS2345: Argument of type 'string | string[]' is not assignable to parameter of type 'string'.
  Type 'string[]' is not assignable to type 'string'.
src/routes/webhook-management.ts(177,17): error TS2345: Argument of type 'string | string[]' is not assignable to parameter of type 'string'.
  Type 'string[]' is not assignable to type 'string'.
src/routes/webhook-management.ts(233,17): error TS2345: Argument of type 'string | string[]' is not assignable to parameter of type 'string'.
  Type 'string[]' is not assignable to type 'string'.
src/routes/webhooks.ts(23,7): error TS2322: Type 'null' is not assignable to type 'string'.
src/routes/webhooks.ts(26,7): error TS2322: Type 'unknown' is not assignable to type 'Json | undefined'.
src/routes/webhooks.ts(275,57): error TS2322: Type 'string' is not assignable to type '"todo" | "in_progress" | "in_review" | "blocked" | "done" | null | undefined'.
src/routes/webhooks.ts(364,51): error TS2322: Type 'string' is not assignable to type '"closed" | "in_progress" | "new" | "triaged" | "waiting_on_client" | "resolved" | null | undefined'.
src/services/approvals.ts(227,5): error TS2322: Type 'Record<string, unknown>' is not assignable to type 'Json | undefined'.
  Type 'Record<string, unknown>' is missing the following properties from type 'Json[]': length, pop, push, concat, and 29 more.
src/services/audit.ts(47,64): error TS2345: Argument of type '{ organization_id: string | null; actor_user_id: string | null; actor_type: "user" | "system"; action: string; entity_type: string; entity_id: string | null; metadata: Record<string, unknown>; }' is not assignable to parameter of type 'RejectExcessProperties<{ action: string; entity_type: string; actor_type?: "user" | "system" | "service" | null | undefined; actor_user_id?: string | null | undefined; created_at?: string | null | undefined; ... 5 more ...; user_agent?: string | ... 1 more ... | undefined; }, { ...; }> | RejectExcessProperties<...>[]'.
  Type '{ organization_id: string | null; actor_user_id: string | null; actor_type: "user" | "system"; action: string; entity_type: string; entity_id: string | null; metadata: Record<string, unknown>; }' is not assignable to type 'RejectExcessProperties<{ action: string; entity_type: string; actor_type?: "user" | "system" | "service" | null | undefined; actor_user_id?: string | null | undefined; created_at?: string | null | undefined; ... 5 more ...; user_agent?: string | ... 1 more ... | undefined; }, { ...; }>'.
    Type '{ organization_id: string | null; actor_user_id: string | null; actor_type: "user" | "system"; action: string; entity_type: string; entity_id: string | null; metadata: Record<string, unknown>; }' is not assignable to type '{ action: string; entity_type: string; actor_type?: "user" | "system" | "service" | null | undefined; actor_user_id?: string | null | undefined; created_at?: string | null | undefined; ... 5 more ...; user_agent?: string | ... 1 more ... | undefined; }'.
      Types of property 'metadata' are incompatible.
        Type 'Record<string, unknown>' is not assignable to type 'Json | undefined'.
          Type 'Record<string, unknown>' is missing the following properties from type 'Json[]': length, pop, push, concat, and 29 more.
src/services/client-onboarding-command-center.ts(621,7): error TS2322: Type 'Record<string, unknown>' is not assignable to type 'Json | undefined'.
  Type 'Record<string, unknown>' is missing the following properties from type 'Json[]': length, pop, push, concat, and 29 more.
src/services/client-onboarding-command-center.ts(623,7): error TS2322: Type 'Record<string, unknown>' is not assignable to type 'Json | undefined'.
  Type 'Record<string, unknown>' is missing the following properties from type 'Json[]': length, pop, push, concat, and 29 more.
src/services/client-onboarding-command-center.ts(626,7): error TS2322: Type 'Record<string, unknown>' is not assignable to type 'Json | undefined'.
  Type 'Record<string, unknown>' is missing the following properties from type 'Json[]': length, pop, push, concat, and 29 more.
src/services/client-onboarding-command-center.ts(631,7): error TS2322: Type 'unknown[]' is not assignable to type 'Json | undefined'.
  Type 'unknown[]' is not assignable to type 'Json[]'.
    Type 'unknown' is not assignable to type 'Json'.
src/services/client-onboarding-command-center.ts(695,13): error TS2345: Argument of type 'Record<string, unknown>' is not assignable to parameter of type 'RejectExcessProperties<{ access_collection_status?: string | null | undefined; access_credentials?: Json | undefined; client_contact_email?: string | null | undefined; client_contact_phone?: string | ... 1 more ... | undefined; ... 28 more ...; version?: number | ... 1 more ... | undefined; }, Record<...>>'.
  Type 'Record<string, unknown>' is not assignable to type '{ [x: string]: never; }'.
    'string' index signatures are incompatible.
      Type 'unknown' is not assignable to type 'never'.
src/services/client-onboarding-command-center.ts(869,13): error TS2345: Argument of type 'Record<string, unknown>' is not assignable to parameter of type 'RejectExcessProperties<{ completed_at?: string | null | undefined; completed_by?: string | null | undefined; created_at?: string | null | undefined; description?: string | null | undefined; id?: string | null | undefined; ... 9 more ...; updated_at?: string | ... 1 more ... | undefined; }, Record<...>>'.
  Type 'Record<string, unknown>' is not assignable to type '{ [x: string]: never; }'.
    'string' index signatures are incompatible.
      Type 'unknown' is not assignable to type 'never'.
src/services/dynamic-client-forms-builder.ts(106,7): error TS2322: Type '{ key: string; label: string; type: string; required: boolean; placeholder: string | null; options: string[]; helpText: string | null; validation: Record<string, unknown>; sortOrder: number; }[]' is not assignable to type 'Json | undefined'.
  Type '{ key: string; label: string; type: string; required: boolean; placeholder: string | null; options: string[]; helpText: string | null; validation: Record<string, unknown>; sortOrder: number; }[]' is not assignable to type 'Json[]'.
    Type '{ key: string; label: string; type: string; required: boolean; placeholder: string | null; options: string[]; helpText: string | null; validation: Record<string, unknown>; sortOrder: number; }' is not assignable to type 'Json'.
      Type '{ key: string; label: string; type: string; required: boolean; placeholder: string | null; options: string[]; helpText: string | null; validation: Record<string, unknown>; sortOrder: number; }' is not assignable to type '{ [key: string]: Json | undefined; }'.
        Property 'validation' is incompatible with index signature.
          Type 'Record<string, unknown>' is not assignable to type 'Json | undefined'.
            Type 'Record<string, unknown>' is missing the following properties from type 'Json[]': length, pop, push, concat, and 29 more.
src/services/dynamic-client-forms-builder.ts(107,7): error TS2322: Type 'Record<string, unknown>' is not assignable to type 'Json | undefined'.
  Type 'Record<string, unknown>' is missing the following properties from type 'Json[]': length, pop, push, concat, and 29 more.
src/services/dynamic-client-forms-builder.ts(155,13): error TS2345: Argument of type 'Record<string, unknown>' is not assignable to parameter of type 'RejectExcessProperties<{ closes_at?: string | null | undefined; created_at?: string | null | undefined; created_by?: string | null | undefined; description?: string | null | undefined; fields?: Json | undefined; ... 7 more ...; updated_at?: string | ... 1 more ... | undefined; }, Record<...>>'.
  Type 'Record<string, unknown>' is not assignable to type '{ [x: string]: never; }'.
    'string' index signatures are incompatible.
      Type 'unknown' is not assignable to type 'never'.
src/services/dynamic-client-forms-builder.ts(212,13): error TS2345: Argument of type 'Record<string, unknown>' is not assignable to parameter of type 'RejectExcessProperties<{ closes_at?: string | null | undefined; created_at?: string | null | undefined; created_by?: string | null | undefined; description?: string | null | undefined; fields?: Json | undefined; ... 7 more ...; updated_at?: string | ... 1 more ... | undefined; }, Record<...>>'.
  Type 'Record<string, unknown>' is not assignable to type '{ [x: string]: never; }'.
    'string' index signatures are incompatible.
      Type 'unknown' is not assignable to type 'never'.
src/services/dynamic-client-forms-builder.ts(261,7): error TS2322: Type 'Record<string, unknown>' is not assignable to type 'Json | undefined'.
  Type 'Record<string, unknown>' is missing the following properties from type 'Json[]': length, pop, push, concat, and 29 more.
src/services/satisfaction-pulse-widget.ts(131,7): error TS2322: Type 'string | null | undefined' is not assignable to type 'never'.
  Type 'undefined' is not assignable to type 'never'.
src/services/satisfaction-pulse-widget.ts(133,7): error TS2322: Type 'string | null | undefined' is not assignable to type 'never'.
  Type 'undefined' is not assignable to type 'never'.
src/services/satisfaction-pulse-widget.ts(134,7): error TS2322: Type 'string | null | undefined' is not assignable to type 'never'.
  Type 'undefined' is not assignable to type 'never'.
src/services/satisfaction-pulse-widget.ts(135,7): error TS2322: Type 'string' is not assignable to type 'never'.
src/services/satisfaction-pulse-widget.ts(178,13): error TS2345: Argument of type 'Record<string, unknown>' is not assignable to parameter of type 'RejectExcessProperties<{ created_at?: string | null | undefined; feedback?: string | null | undefined; id?: string | null | undefined; organization_id?: string | null | undefined; question?: string | null | undefined; ... 10 more ...; updated_at?: string | ... 1 more ... | undefined; }, Record<...>>'.
  Type 'Record<string, unknown>' is not assignable to type '{ [x: string]: never; }'.
    'string' index signatures are incompatible.
      Type 'unknown' is not assignable to type 'never'.
src/services/satisfaction-pulse-widget.ts(232,26): error TS2551: Property 'created_by' does not exist on type '{ created_at: string; feedback: string | null; id: string; organization_id: string; question: string | null; rating: number; responded_at: string | null; respondent_organization_id: string | null; ... 7 more ...; updated_at: string; }'. Did you mean 'created_at'?
src/services/satisfaction-pulse-widget.ts(342,7): error TS2322: Type 'string' is not assignable to type 'never'.
src/services/satisfaction-pulse-widget.ts(343,7): error TS2322: Type 'string | null | undefined' is not assignable to type 'never'.
  Type 'undefined' is not assignable to type 'never'.
src/services/satisfaction-pulse-widget.ts(344,7): error TS2322: Type 'number' is not assignable to type 'never'.
src/services/satisfaction-pulse-widget.ts(375,13): error TS2345: Argument of type 'Partial<SatisfactionPulseTemplate>' is not assignable to parameter of type 'RejectExcessProperties<{ created_at?: string | null | undefined; created_by?: string | null | undefined; description?: string | null | undefined; id?: string | null | undefined; is_active?: boolean | null | undefined; ... 4 more ...; updated_at?: string | ... 1 more ... | undefined; }, Partial<...>>'.
  Type 'Partial<SatisfactionPulseTemplate>' is not assignable to type '{ question: never; subject: never; default_rating: never; }'.
    Types of property 'question' are incompatible.
      Type 'string | null | undefined' is not assignable to type 'never'.
        Type 'undefined' is not assignable to type 'never'.
src/services/satisfaction-pulse-widget.ts(450,7): error TS2322: Type 'Record<string, unknown>' is not assignable to type 'Json | undefined'.
  Type 'Record<string, unknown>' is missing the following properties from type 'Json[]': length, pop, push, concat, and 29 more.
src/services/satisfaction-pulse-widget.ts(483,13): error TS2345: Argument of type 'Partial<SatisfactionPulseSchedule>' is not assignable to parameter of type 'RejectExcessProperties<{ created_at?: string | null | undefined; created_by?: string | null | undefined; cron_expression?: string | null | undefined; frequency?: string | null | undefined; id?: string | null | undefined; ... 8 more ...; updated_at?: string | ... 1 more ... | undefined; }, { ...; }>'.
  Type 'Partial<SatisfactionPulseSchedule>' is not assignable to type '{ created_at?: string | null | undefined; created_by?: string | null | undefined; cron_expression?: string | null | undefined; frequency?: string | null | undefined; id?: string | null | undefined; ... 8 more ...; updated_at?: string | ... 1 more ... | undefined; }'.
    Types of property 'trigger_config' are incompatible.
      Type 'Record<string, unknown> | undefined' is not assignable to type 'Json | undefined'.
        Type 'Record<string, unknown>' is not assignable to type 'Json | undefined'.
          Type 'Record<string, unknown>' is missing the following properties from type 'Json[]': length, pop, push, concat, and 29 more.
```
