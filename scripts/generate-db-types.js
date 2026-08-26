#!/usr/bin/env node
/**
 * Generates Supabase Database types from SQL migration files.
 * Parses CREATE TABLE, ALTER TABLE ADD COLUMN, and CREATE TYPE statements.
 */
const fs = require("fs");
const path = require("path");

const MIGRATIONS_DIR = path.join(__dirname, "..", "supabase", "migrations");
const OUTPUT_FILE = path.join(__dirname, "..", "packages", "sdk", "src", "database.types.ts");

// SQL type → TypeScript type mapping
const TYPE_MAP = {
  uuid: "string",
  text: "string",
  varchar: "string",
  "character varying": "string",
  "varchar[]": "string[]",
  "text[]": "string[]",
  char: "string",
  bpchar: "string",
  name: "string",
  json: "Json",
  jsonb: "Json",
  "json[]": "Json[]",
  "jsonb[]": "Json[]",
  boolean: "boolean",
  bool: "boolean",
  integer: "number",
  int4: "number",
  int: "number",
  smallint: "number",
  int2: "number",
  bigint: "number",
  int8: "number",
  real: "number",
  float4: "number",
  "double precision": "number",
  float8: "number",
  numeric: "number",
  decimal: "number",
  money: "number",
  timestamp: "string",
  "timestamp with time zone": "string",
  timestamptz: "string",
  "timestamp without time zone": "string",
  date: "string",
  time: "string",
  "time with time zone": "string",
  timetz: "string",
  interval: "string",
  bytea: "string",
  inet: "string",
  cidr: "string",
  tsvector: "string",
  tsquery: "string",
  citext: "string",
  inet: "string",
  cidr: "string",
  macaddr: "string",
  xml: "string",
  tsvector: "string",
  tsquery: "string",
  "user-defined": "string",
};

function parseSqlType(sqlType) {
  if (!sqlType) return "unknown";
  const lower = sqlType.toLowerCase().trim();

  // Handle arrays: e.g. "text[]" or "character varying[]"
  const isArray = lower.endsWith("[]");
  const base = isArray ? lower.slice(0, -2).trim() : lower;

  // Handle precision: e.g. "varchar(255)" or "numeric(10,2)"
  // Strip schema qualifiers: "public.audit_actor_type" → "audit_actor_type"
  const withoutPrecision = base
    .replace(/\(.*?\)/g, "")
    .trim()
    .split(".")
    .pop()
    .trim();

  // Custom enum types → union of their values
  if (ENUMS[withoutPrecision]) {
    const union = ENUMS[withoutPrecision].map(v => JSON.stringify(v)).join(" | ");
    return isArray ? `(${union})[]` : union;
  }

  // Handle "double precision" (two words)
  const tsType = TYPE_MAP[withoutPrecision] || TYPE_MAP[base] || "unknown";

  if (isArray && tsType !== "unknown") return `${tsType}[]`;
  if (isArray) return "unknown[]";
  return tsType;
}

function parseCreateTable(sql) {
  const tables = {};
  // Match CREATE TABLE (with optional IF NOT EXISTS) — handles multi-line
  const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?["']?(?:public\.)?(\w+)["']?\s*\(([\s\S]*?)\)\s*;/gi;
  let match;

  while ((match = tableRegex.exec(sql)) !== null) {
    const tableName = match[1].toLowerCase();
    const body = match[2];

    const columns = {};
    // Split by commas, but not commas inside parentheses
    const parts = [];
    let depth = 0;
    let current = "";
    for (const char of body) {
      if (char === "(") depth++;
      else if (char === ")") depth--;
      if (char === "," && depth === 0) {
        parts.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    if (current.trim()) parts.push(current.trim());

    for (const part of parts) {
      const trimmed = part.trim();
      // Skip constraints, indexes, PRIMARY KEY, UNIQUE, CHECK, FOREIGN KEY, CONSTRAINT
      if (/^\s*(PRIMARY\s+KEY|UNIQUE|CHECK|FOREIGN\s+KEY|CONSTRAINT|INDEX|EXCLUDE)\s/i.test(trimmed)) continue;

      // Match column definition: column_name type [constraints]
      const colMatch = trimmed.match(/^[""]?(\w+)[""]?\s+([\w\s().,\[\].]+?)(\s+.*)?$/i);
      if (colMatch) {
        const colName = colMatch[1].toLowerCase();
        const colType = colMatch[2].trim();
        const constraints = colMatch[3] || "";
        const notNull = /NOT\s+NULL/i.test(constraints);
        const hasDefault = /DEFAULT\s/i.test(constraints);
        const isGenerated = /GENERATED\s+(ALWAYS|BY\s+DEFAULT)\s+AS/i.test(constraints);

        // Generated columns don't need to be inserted
        if (isGenerated) continue;

        let tsType = parseSqlType(colType);
        // If nullable or has a default, it can be omitted on insert
        columns[colName] = {
          row: !notNull && !hasDefault ? `${tsType} | null` : tsType,
          insertOpt: !notNull || hasDefault,
        };
        const refMatch = trimmed.match(REF_RE);
        if (refMatch) {
          addRel(tableName, colName, refMatch[1].toLowerCase(), refMatch[2].toLowerCase(), `${tableName}_${colName}_fkey`);
        }
      }
    }

    if (Object.keys(columns).length > 0) {
      tables[tableName] = columns;
    }
  }

  return tables;
}

function parseAlterTable(sql) {
  const alters = {};

  // Split by semicolons to get individual statements
  const statements = sql.split(/;\s*(?:--.*)?$/m);

  for (const stmt of statements) {
    // Find the ALTER TABLE name
    const tableMatch = stmt.match(/ALTER\s+TABLE\s+(?:IF\s+EXISTS\s+)?["']?(?:public\.)?(\w+)["']?\s+/i);
    if (!tableMatch) continue;
    const tableName = tableMatch[1].toLowerCase();

    // Split by commas to get individual ADD COLUMN clauses
    const addIdx = stmt.toUpperCase().indexOf('ADD COLUMN');
    if (addIdx === -1) continue;
    const addBlock = stmt.substring(addIdx);
    const colClauses = addBlock.split(/\s*,\s*ADD\s+COLUMN\s+/i);

    for (let i = 0; i < colClauses.length; i++) {
      let clause = colClauses[i].trim();
      // First clause still has "ADD COLUMN" prefix
      if (i === 0) {
        clause = clause.replace(/^ADD\s+(?:IF\s+NOT\s+EXISTS\s+)?COLUMN\s+/i, '');
      }

      // Now parse: "if not exists col_name type [constraints]"
      const colMatch = clause.match(/^(?:IF\s+NOT\s+EXISTS\s+)?["']?(\w+)["']?\s+([\w\s().,\[\].]+?)(?:\s+(?:NOT\s+NULL|NULL|DEFAULT|PRIMARY|UNIQUE|CHECK|FOREIGN|REFERENCES|CONSTRAINT|GENERATED|COLLATE)\b.*)?$/i);
      if (!colMatch) continue;

      const colName = colMatch[1].toLowerCase();
      const colType = colMatch[2].trim();
      const notNull = /NOT\s+NULL/i.test(clause);
      const hasDefault = /DEFAULT\s/i.test(clause);
      const isGenerated = /GENERATED\s+(ALWAYS|BY\s+DEFAULT)\s+AS/i.test(clause);

      if (isGenerated) continue;

      if (!alters[tableName]) alters[tableName] = {};
      let tsType = parseSqlType(colType);
      alters[tableName][colName] = {
        row: !notNull && !hasDefault ? `${tsType} | null` : tsType,
        insertOpt: !notNull || hasDefault,
      };
      const refMatch = clause.match(REF_RE);
      if (refMatch) {
        addRel(tableName, colName, refMatch[1].toLowerCase(), refMatch[2].toLowerCase(), `${tableName}_${colName}_fkey`);
      }
    }
  }

  return alters;
}

function parseDropTable(sql) {
  const drops = new Set();
  const dropRegex = /DROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?["']?(?:public\.)?(\w+)["']?/gi;
  let match;
  while ((match = dropRegex.exec(sql)) !== null) {
    drops.add(match[1].toLowerCase());
  }
  return drops;
}

function parseAlterTableDrop(sql) {
  const drops = new Map();
  const regex = /ALTER\s+TABLE\s+(?:IF\s+EXISTS\s+)?["']?(?:public\.)?(\w+)["']?\s+DROP\s+(?:IF\s+EXISTS\s+)?COLUMN\s+["']?(\w+)["']?/gi;
  let match;
  while ((match = regex.exec(sql)) !== null) {
    const table = match[1].toLowerCase();
    const col = match[2].toLowerCase();
    if (!drops.has(table)) drops.set(table, new Set());
    drops.get(table).add(col);
  }
  return drops;
}

function parseAlterTableRename(sql) {
  const renames = [];
  const regex = /ALTER\s+TABLE\s+(?:IF\s+EXISTS\s+)?["']?(?:public\.)?(\w+)["']?\s+RENAME\s+(?:IF\s+EXISTS\s+)?COLUMN\s+["']?(\w+)["']?\s+TO\s+["']?(\w+)["']?/gi;
  let match;
  while ((match = regex.exec(sql)) !== null) {
    renames.push({ table: match[1].toLowerCase(), from: match[2].toLowerCase(), to: match[3].toLowerCase() });
  }
  return renames;
}

// Read all migration files in sorted order
const files = fs.readdirSync(MIGRATIONS_DIR)
  .filter(f => f.endsWith(".sql"))
  .sort();

console.log(`Processing ${files.length} migration files...`);

// Pre-pass: collect custom enum types (CREATE TYPE x AS ENUM (...))
const ENUMS = {};
function parseEnums(sql) {
  const re = /create\s+type\s+(?:public\.)?(\w+)\s+as\s+enum\s*\(([^)]*)\)/gi;
  let m;
  while ((m = re.exec(sql)) !== null) {
    const name = m[1].toLowerCase();
    const values = [...m[2].matchAll(/'([^']*)'/g)].map(v => v[1]);
    if (values.length > 0) ENUMS[name] = values;
  }
}

// Collect foreign-key relationships (needed by supabase-js embedded queries,
// e.g. select("*, roles!inner(...)"))
const RELS = {};
function addRel(table, col, refTable, refCol, name) {
  if (!RELS[table]) RELS[table] = [];
  const k = `${col}>${refTable}.${refCol}`;
  if (RELS[table].some(r => r._k === k)) return;
  RELS[table].push({ _k: k, col, refTable, refCol, name });
}
const REF_RE = /references\s+(?:only\s+)?(?:public\.)?["']?(\w+)["']?\s*\(\s*["']?(\w+)["']?\s*\)/i;

// Named-constraint form: constraint fk_x foreign key (col) references t (c)
function parseConstraintFks(sql) {
  const stmts = sql.split(/;\s*(?:--.*)?$/m);
  for (const stmt of stmts) {
    if (!/foreign\s+key/i.test(stmt)) continue;
    const tableMatch = stmt.match(/(?:create\s+table\s+(?:if\s+not\s+exists\s+)?|alter\s+table\s+(?:if\s+exists\s+)?|create\s+table\s+)(?:public\.)?["']?(\w+)["']?\s/i);
    if (!tableMatch) continue;
    const tableName = tableMatch[1].toLowerCase();
    const re = /constraint\s+["']?(\w+)["']?\s+foreign\s+key\s*\(\s*["']?(\w+)["']?\s*\)\s*references\s+(?:public\.)?["']?(\w+)["']?\s*\(\s*["']?(\w+)["']?\s*\)/gi;
    let m;
    while ((m = re.exec(stmt)) !== null) {
      addRel(tableName, m[2].toLowerCase(), m[3].toLowerCase(), m[4].toLowerCase(), m[1].toLowerCase());
    }
  }
}
for (const file of files) {
  parseEnums(fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf-8"));
}
console.log(`Found ${Object.keys(ENUMS).length} enum types: ${Object.keys(ENUMS).join(", ")}`);

// Build final table schemas
const tables = {};

for (const file of files) {
  const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf-8");

  // Parse drops first
  const droppedTables = parseDropTable(sql);
  for (const t of droppedTables) {
    delete tables[t];
  }

  const droppedColumns = parseAlterTableDrop(sql);
  for (const [table, cols] of droppedColumns) {
    if (tables[table]) {
      for (const col of cols) {
        delete tables[table][col];
      }
    }
  }

  // Parse renames
  const renames = parseAlterTableRename(sql);
  for (const { table, from, to } of renames) {
    if (tables[table] && tables[table][from]) {
      tables[table][to] = tables[table][from];
      delete tables[table][from];
    }
  }

  // Parse CREATE TABLE
  const created = parseCreateTable(sql);
  for (const [table, columns] of Object.entries(created)) {
    if (!tables[table]) tables[table] = {};
    Object.assign(tables[table], columns);
  }

  // Parse ALTER TABLE ADD COLUMN
  const altered = parseAlterTable(sql);
  for (const [table, columns] of Object.entries(altered)) {
    if (!tables[table]) tables[table] = {};
    Object.assign(tables[table], columns);
  }

  // Parse named FK constraints
  parseConstraintFks(sql);
}

// Filter out internal Supabase tables
const SUPABASE_INTERNAL = new Set([
  "schema_migrations",
  "igrations",
  "supabase_functions",
  "hooks",
]);

// Generate TypeScript
const sortedTables = Object.keys(tables).sort();
let output = `// Auto-generated from supabase/migrations/*.sql — DO NOT EDIT MANUALLY
// Run: node scripts/generate-db-types.js to regenerate
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
`;

for (const tableName of sortedTables) {
  if (SUPABASE_INTERNAL.has(tableName)) continue;

  const columns = tables[tableName];
  const sortedCols = Object.keys(columns).sort();

  // Separate required vs optional columns for Insert
  const required = [];
  const optional = [];
  for (const col of sortedCols) {
    if (columns[col].insertOpt) {
      optional.push(col);
    } else {
      required.push(col);
    }
  }

  output += `      ${tableName}: {
        Row: {`;
  for (const col of sortedCols) {
    output += `\n          ${col}: ${columns[col].row};`;
  }
  output += `\n        };`;
  output += `\n        Insert: {`;
  for (const col of required) {
    output += `\n          ${col}: ${columns[col].row};`;
  }
  for (const col of optional) {
    const base = columns[col].row.replace(/ \| null$/, "");
    output += `\n          ${col}?: ${base} | null;`;
  }
  output += `\n        };`;
  output += `\n        Update: {`;
  for (const col of sortedCols) {
    const t = columns[col].row.replace(/ \| null$/, "");
    output += `\n          ${col}?: ${t} | null;`;
  }
  output += `\n        };`;
  output += `\n        Relationships: [`;
  for (const rel of RELS[tableName] || []) {
    output += `\n          { foreignKeyName: ${JSON.stringify(rel.name)}, columns: [${JSON.stringify(rel.col)}], isOneToOne: false, referencedRelation: ${JSON.stringify(rel.refTable)}, referencedColumns: [${JSON.stringify(rel.refCol)}] },`;
  }
  output += `\n        ];`;
  output += `\n      };`;
}

output += `    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
`;
for (const enumName of Object.keys(ENUMS).sort()) {
  const union = ENUMS[enumName].map(v => JSON.stringify(v)).join(" | ");
  output += `      ${enumName}: ${union};\n`;
}
output += `    };
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;
`;

fs.writeFileSync(OUTPUT_FILE, output);
console.log(`Generated types for ${sortedTables.length} tables → ${OUTPUT_FILE}`);

// Print table summary
for (const t of sortedTables) {
  if (SUPABASE_INTERNAL.has(t)) continue;
  const colCount = Object.keys(tables[t]).length;
  console.log(`  ${t}: ${colCount} columns`);
}
