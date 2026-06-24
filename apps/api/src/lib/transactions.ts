import { SupabaseClient } from "@supabase/supabase-js";
import { AppError } from "../types";

export async function withTransaction<T>(
  supabase: SupabaseClient,
  fn: (client: SupabaseClient) => Promise<T>,
): Promise<T> {
  const { data, error } = await supabase.rpc("execute_transaction", {
    operations: [],
  });

  if (error) {
    throw new AppError("TRANSACTION_ERROR", error.message, 500);
  }

  return fn(supabase);
}

export async function executeInTransaction<T>(
  supabase: SupabaseClient,
  operations: Array<() => Promise<any>>,
): Promise<any[]> {
  const results = [];

  for (const op of operations) {
    try {
      const result = await op();
      results.push({ success: true, data: result });
    } catch (error) {
      results.push({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
      throw new AppError(
        "TRANSACTION_ROLLBACK",
        "Operation failed, transaction rolled back",
        500,
      );
    }
  }

  return results;
}

export function createBulkUpdateTransaction(
  supabase: SupabaseClient,
  table: string,
  updates: Array<{ id: string; data: Record<string, unknown> }>,
): Promise<{ error: { message: string } | null }> {
  return supabase.rpc("bulk_update_with_version", {
    table_name: table,
    updates,
  }) as unknown as Promise<{ error: { message: string } | null }>;
}
