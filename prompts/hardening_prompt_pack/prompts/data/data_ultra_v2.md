DATA INTEGRITY ULTRA — v2 (augmented checks)

## Additional Focus (beyond data_ultra.md)

- Schema vs runtime vs API parity — full field-by-field comparison
- Mutation risk map — every write endpoint with its affected tables
- Inconsistent read detection — polling without version stamps

## Automation-only Checks (not in v1)

    - id: DAT-005
      desc: "Profile PATCH updates without version check"
      grep: "router\.patch"
      path: "apps/api/src/routes/profiles.ts"
      expect: "profiles.ts PATCH handler must be checked for missing optimistic locking"
