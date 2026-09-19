import type { Database, Json } from "@mct/sdk/database.types";

export type TableName = keyof Database["public"]["Tables"];
export type Row<T extends TableName> = Database["public"]["Tables"][T]["Row"];
export type InsertRow<T extends TableName> = Database["public"]["Tables"][T]["Insert"];
export type UpdateRow<T extends TableName> = Database["public"]["Tables"][T]["Update"];

/**
 * Cast a value known to be JSON-serializable to the generated `Json` type.
 *
 * Zod schemas such as `z.record(z.unknown())` produce `Record<string, unknown>`
 * which TypeScript cannot narrow to `Json` even though the value is JSON by
 * construction. Use this at those boundaries instead of an `as any`.
 */
export function toJson(value: unknown): Json {
  return value as Json;
}

/**
 * Cast a programmatically-built row payload to a table's Insert/Update type.
 * Use for payloads whose keys are validated separately (zod) or assembled
 * from a field map, where a literal type is not practical.
 */
export function asInsert<T extends TableName>(value: Record<string, unknown>): InsertRow<T> {
  return value as unknown as InsertRow<T>;
}

export function asUpdate<T extends TableName>(value: Record<string, unknown>): UpdateRow<T> {
  return value as unknown as UpdateRow<T>;
}
