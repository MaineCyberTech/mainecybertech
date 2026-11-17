#!/usr/bin/env python3
"""Filter a pg_dump SQL file for the throwaway restore test.

The stock PostgreSQL test image cannot install Supabase's ``supabase_vault``
extension, and the dump carries the extension-owned ``vault`` schema data and
ACLs.  The production dump stays complete; this helper removes only the
Supabase vault schema so the public schema and migration ledger can be restored
and asserted by ``db-restore-test.yml``.
"""
from __future__ import annotations

import sys
from pathlib import Path


def is_supabase_vault_statement(line: str) -> bool:
    """Return True for extension DDL that stock Postgres cannot execute."""
    prefixes = (
        "CREATE EXTENSION IF NOT EXISTS supabase_vault",
        "CREATE EXTENSION supabase_vault",
        "COMMENT ON EXTENSION supabase_vault",
        "ALTER EXTENSION supabase_vault",
    )
    return line.startswith(prefixes)


def is_vault_schema_statement(line: str) -> bool:
    """Return True for vault schema DDL/ACLs owned by the extension."""
    if line in ("CREATE SCHEMA vault;", "CREATE SCHEMA IF NOT EXISTS vault;"):
        return True
    if line.startswith(
        (
            "CREATE TABLE vault.",
            "CREATE VIEW vault.",
            "CREATE FUNCTION vault.",
            "CREATE SEQUENCE vault.",
            "ALTER TABLE vault.",
            "ALTER VIEW vault.",
            "ALTER FUNCTION vault.",
        )
    ):
        return True
    if line.startswith(("GRANT ", "REVOKE ", "ALTER ", "COMMENT ON ")):
        return " vault" in line or "SCHEMA vault" in line
    return False


def filter_sql(source: Path, target: Path) -> None:
    lines: list[str] = []
    skip_copy = False
    for line in source.read_text(encoding="utf-8", errors="replace").splitlines():
        if line.startswith("COPY vault."):
            skip_copy = True
            continue
        if skip_copy:
            if line == "\\.":
                skip_copy = False
            continue
        if is_supabase_vault_statement(line) or is_vault_schema_statement(line):
            continue
        lines.append(line)
    target.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> int:
    if len(sys.argv) != 3:
        print(f"usage: {sys.argv[0]} <source.sql> <target.sql>", file=sys.stderr)
        return 2
    filter_sql(Path(sys.argv[1]), Path(sys.argv[2]))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
