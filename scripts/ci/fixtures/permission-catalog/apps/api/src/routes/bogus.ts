// Negative fixture: `ghost:view` is absent from the fixture catalog in
// ../../supabase/migrations/5300001_seed.sql, so the permission-catalog guard
// must fail when run with --root pointing at this fixture.
export const gate = requirePermission("ghost", "view");
