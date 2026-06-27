# Migration Naming Convention Guide

## Overview
This document establishes the standard naming convention for database migrations in the MCT Client Portal. Consistent naming ensures easy tracking, rollback capability, and team collaboration.

## Naming Pattern

**Format:** `YYYYMMDDHHMMSS_<descriptive_name>.sql`

### Components:
- **Timestamp**: `YYYYMMDDHHMMSS` - UTC timestamp when migration was created
- **Separator**: Single underscore `_`
- **Description**: Lowercase, snake_case, action-oriented description

### Examples:
| Migration | Description |
|-----------|-------------|
| `20260626120000_create_user_profiles.sql` | Creates user profiles table |
| `20260626120001_add_user_email_index.sql` | Adds email index to users |
| `20260626120002_update_user_status_enum.sql` | Updates user status enum values |
| `20260626130000_create_tickets_table.sql` | Creates tickets table |
| `20260626130001_add_ticket_status_check.sql` | Adds check constraint on ticket status |

## Guidelines

### 1. Timestamp Format
- Use UTC timezone
- Format: `YYYYMMDDHHMMSS` (14 digits)
- Ensures chronological sorting and unique ordering

### 2. Description Guidelines
- **Action-oriented**: start with verb (create, add, update, remove, rename, alter)
- **Lowercase**: all letters lowercase
- **Snake_case**: words separated by underscores
- **Descriptive**: clearly indicates what the migration does
- **Concise**: maximum 50 characters after timestamp

### 3. Migration Types & Prefixes

| Action | Prefix | Example |
|--------|--------|---------|
| Create table | `create_` | `create_users_table` |
| Add column | `add_` | `add_email_to_users` |
| Add index | `add_` + `idx_` | `add_idx_email_to_users` |
| Add constraint | `add_` + `constraint_` | `add_constraint_email_unique` |
| Remove column | `remove_` | `remove_deprecated_field` |
| Remove index | `remove_` | `remove_old_index` |
| Rename | `rename_` | `rename_old_column_to_new` |
| Alter/Modify | `alter_` | `alter_column_type` |
| Update data | `update_` | `update_user_statuses` |
| Seed data | `seed_` | `seed_default_roles` |
| Cleanup | `cleanup_` | `cleanup_unused_tables` |

### 4. Special Cases
- **Data migrations**: Use `update_` or `seed_` prefix
- **Schema-only changes**: Use structural prefixes (`create_`, `add_`, `alter_`, `remove_`)
- **Rollback scripts**: Include rollback instructions in comments

## Migration Checklist

Before creating a new migration:

1. [ ] Check existing migrations for similar changes
2. [ ] Generate timestamp: `date -u +%Y%m%d%H%M%S`
3. [ ] Write descriptive name following conventions
4. [ ] Verify no duplicate timestamps exist
5. [ ] Ensure migration is idempotent where possible
6. [ ] Add rollback comments in SQL file
6. [ ] Test migration on staging first
7. [ ] Update any related documentation

## File Structure

```
supabase/
├── migrations/
│   ├── 20240115120000_create_users_table.sql
│   ├── 20240115120001_add_email_uniqueness.sql
│   ├── 20240115120002_create_profiles_table.sql
│   └── ...
├── seeds/
│   ├── 01_initial_roles.sql
│   └── ...
└── config.toml
```

## Anti-Patterns to Avoid

| ❌ Avoid | ✅ Use Instead |
|----------|----------------|
| `migration_001.sql` | `20240115120000_create_users.sql` |
| `fix_bug.sql` | `20240115120000_fix_user_email_validation.sql` |
| `V2__create_table.sql` | `20240115120000_create_users_table.sql` |
| `migration_v2.sql` | `20240115120000_add_user_email_index.sql` |
| `changes.sql` | `20240115120000_update_user_status_enum.sql` |

## Migration Template

```sql
-- Migration: 20260626120000_create_example_table.sql
-- Description: Creates the example table for demonstration
-- Author: [Your Name]
-- Date: 2026-06-26
-- Rollback: DROP TABLE IF EXISTS example;

-- Create table
CREATE TABLE example (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index
CREATE INDEX idx_example_name ON example(name);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_example_updated_at
    BEFORE UPDATE ON example
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

## Validation Commands

```bash
# Check for duplicate timestamps
ls supabase/migrations/ | grep -oE '^[0-9]{14}' | sort | uniq -d

# Check migration order
ls supabase/migrations/ | sort

# Validate migration syntax (dry run)
supabase db diff --schema public

# Run migrations
supabase db push

# Reset database (careful - destroys data!)
supabase db reset
```

## Best Practices

1. **One migration per logical change** - Don't bundle unrelated changes
2. **Write reversible migrations** - Include rollback plan in comments
3. **Test on staging first** - Never run untested migrations on production
4. **Keep migrations small** - Easier to review, debug, and rollback
5. **Document breaking changes** - Note in PR description and changelog
6. **Use transactions** - Wrap multi-statement migrations in `BEGIN; ... COMMIT;`

## Migration Workflow

1. **Create**: Generate migration with proper naming
2. **Review**: Code review for schema changes
3. **Test**: Run on staging/staging environment
4. **Deploy**: Apply via CI/CD pipeline
5. **Verify**: Post-deployment validation
6. **Monitor**: Watch for errors post-deployment

---

*Last updated: 2026-06-26*
*MCT Portal Engineering Team*