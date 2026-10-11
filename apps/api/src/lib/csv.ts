import { type Response } from "express";

export interface CsvColumn {
  key: string;
  label?: string;
}

/**
 * FILE-P2-006: spreadsheet formula injection. Excel/Sheets/LibreOffice execute
 * a cell whose text starts with `=`, `+`, `-`, `@`, tab or carriage return, so
 * a user-controlled value like `=HYPERLINK(...)` becomes a live formula when
 * an exported CSV is opened. Prefix the standard text marker (`'`) so the cell
 * is treated as text. Plain numbers (e.g. `-12.5`) are left untouched — they
 * cannot be formulas and mangling them would corrupt the export.
 */
function needsFormulaGuard(s: string): boolean {
  if (!/^[=+\-@\t\r]/.test(s)) return false;
  return !/^[-+]?\d+(\.\d+)?$/.test(s);
}

/** Quote/escape a single value for CSV output (also applies the formula guard). */
export function escapeCsvValue(v: unknown): string {
  if (v === null || v === undefined) return "";
  const raw = typeof v === "object" ? JSON.stringify(v) : String(v);
  const s = needsFormulaGuard(raw) ? `'${raw}` : raw;
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function rowsToCsv<T extends Record<string, unknown>>(
  rows: T[],
  columns: CsvColumn[],
): string {
  const header = columns.map((c) => c.label ?? c.key).join(",");
  const body = rows.map((row) =>
    columns.map((c) => escapeCsvValue(row[c.key])).join(","),
  );
  return [header, ...body].join("\n");
}

export function formatExportFilename(prefix: string, ext: "csv" | "json"): string {
  return `${prefix}-export-${Date.now()}.${ext}`;
}

export function sendExportResponse<T extends Record<string, unknown>>(
  res: Response,
  rows: T[],
  columns: CsvColumn[],
  filename: string,
): void {
  const format = res.req.query.format as string | undefined;

  if (format === "json") {
    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${formatExportFilename(filename, "json")}"`,
    );
    res.json(rows);
    return;
  }

  const csv = rowsToCsv(rows, columns);
  res.setHeader("Content-Type", "text/csv");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${formatExportFilename(filename, "csv")}"`,
  );
  res.send(csv);
}
