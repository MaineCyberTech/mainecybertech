#!/usr/bin/env python3
"""Static checks for supabase/scripts/portal_psa_export.sql.

This does not connect to a database. It verifies the export stays read-only,
does not select known secret/Stripe columns, and references columns that exist
in the generated Supabase types.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SQL_PATH = ROOT / "supabase" / "scripts" / "portal_psa_export.sql"
TYPES_PATH = ROOT / "packages" / "sdk" / "src" / "database.types.ts"

WRITE_WORDS = re.compile(
    r"\b(insert|update|delete|alter|drop|truncate|grant|revoke|create|vacuum|analyze)\b",
    re.IGNORECASE,
)
FORBIDDEN_TERMS = [
    "stripe_customer_id",
    "stripe_subscription_id",
    "stripe_invoice_id",
    "stripe_payment_intent_id",
    "default_payment_method",
    "encrypted_pii",
    "access_credentials",
    "network_scan_results",
    "password",
    "secret",
    "token",
    "hosted_invoice_url",
    "invoice_pdf_url",
    "storage_bytes",
]
ALIAS_BLACKLIST = {
    "where",
    "on",
    "order",
    "group",
    "left",
    "join",
    "union",
    "with",
    "select",
    "from",
    "as",
}


def parse_types(text: str) -> dict[str, set[str]]:
    tables: dict[str, set[str]] = {}
    pattern = re.compile(
        r"^      ([a-z0-9_]+): \{\n        Row: \{\n(.*?)\n        \};\n        Insert:",
        re.MULTILINE | re.DOTALL,
    )
    for match in pattern.finditer(text):
        columns = set(re.findall(r"^          ([a-z0-9_]+): ", match.group(2), re.MULTILINE))
        tables[match.group(1)] = columns
    return tables


def strip_comments(text: str) -> str:
    text = re.sub(r"/\*.*?\*/", "", text, flags=re.DOTALL)
    return re.sub(r"--[^\n]*", "", text)


def main() -> int:
    if not SQL_PATH.exists():
        print(f"FAIL: missing {SQL_PATH}", file=sys.stderr)
        return 1
    if not TYPES_PATH.exists():
        print(f"FAIL: missing {TYPES_PATH}", file=sys.stderr)
        return 1

    sql = SQL_PATH.read_text(encoding="utf-8")
    clean = strip_comments(sql)
    errors: list[str] = []

    copy_statements = list(
        re.finditer(r"\\copy\s+\((.*?)\)\s+TO\s+'([^']+)'", clean, re.DOTALL)
    )
    if not copy_statements:
        errors.append("no \\copy statements found")
    if "service_role" in clean.lower():
        errors.append("service_role must not be referenced")
    if "begin read only" not in clean.lower():
        errors.append("missing 'begin read only'")
    if not re.search(r"\bcommit\s*;", clean, re.IGNORECASE):
        errors.append("missing 'commit;'")

    outputs: set[str] = set()
    for match in copy_statements:
        query, output = match.group(1), match.group(2)
        if output in outputs:
            errors.append(f"duplicate output path: {output}")
        outputs.add(output)
        if not output.startswith("portal-export/"):
            errors.append(f"output is outside portal-export/: {output}")
        if not output.endswith(".csv"):
            errors.append(f"output is not CSV: {output}")
        if not re.match(r"\s*(select|with)\b", query, re.IGNORECASE):
            errors.append(f"copy query is not SELECT/WITH: {output}")
        for word in WRITE_WORDS.findall(query):
            errors.append(f"write keyword {word!r} in {output}")

    for term in FORBIDDEN_TERMS:
        for match in re.finditer(rf"\b{re.escape(term)}\b", clean, re.IGNORECASE):
            window = clean[match.start() : match.end() + 40]
            # Presence flags are allowed: column IS [NOT] NULL.
            if re.match(rf"{re.escape(term)}\s+IS\s+(NOT\s+)?NULL", window, re.IGNORECASE):
                continue
            line = clean.count("\n", 0, match.start()) + 1
            errors.append(f"forbidden column {term!r} at line {line}")

    tables = parse_types(TYPES_PATH.read_text(encoding="utf-8"))
    for table in sorted(set(re.findall(r"\bpublic\.([a-z0-9_]+)\b", clean))):
        if table not in tables:
            errors.append(f"table public.{table} is not in database.types.ts")

    for match in copy_statements:
        query, output = match.group(1), match.group(2)
        aliases: dict[str, str] = {}
        for rel in re.finditer(
            r"(?:FROM|JOIN)\s+public\.([a-z0-9_]+)(?:\s+(?:AS\s+)?([a-z][a-z0-9_]*))?",
            query,
            re.IGNORECASE,
        ):
            table, alias = rel.group(1), rel.group(2)
            if not alias or alias.lower() in ALIAS_BLACKLIST:
                alias = table
            aliases[alias] = table
        for col in re.finditer(r"\b([a-z][a-z0-9_]*)\.([a-z][a-z0-9_]*)\b", query):
            alias, column = col.group(1), col.group(2)
            table = aliases.get(alias)
            if table is None:
                continue
            if table in tables and column not in tables[table]:
                errors.append(f"{output}: {alias}.{column} not in {table}")

    if errors:
        for error in errors:
            print(f"FAIL: {error}", file=sys.stderr)
        return 1

    print(f"OK: {len(copy_statements)} read-only CSV exports, {len(outputs)} unique paths")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
