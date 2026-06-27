import { type Response } from "express";

export interface CsvColumn {
  key: string;
  label?: string;
}

function escapeCsvValue(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = typeof v === "object" ? JSON.stringify(v) : String(v);
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


