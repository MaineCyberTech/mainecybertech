"use client";

import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import { useState, useRef } from "react";
import type { Category } from "@/lib/catalog/types";
import { importProductsAction, importCategoriesAction } from "./actions";

export interface ExportableProduct {
  id: string;
  slug: string;
  name: string;
  [key: string]: unknown;
}

type ImportOutcome = {
  ok: boolean;
  message: string;
  details?: string[];
};

const PRODUCT_CSV_HEADERS = [
  "id",
  "slug",
  "name",
  "category",
  "categoryId",
  "type",
  "display",
  "status",
  "priceRange",
  "summary",
];

function download(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, "").toLowerCase());
  return lines.slice(1).map((line) => {
    const cells = line.split(",");
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = (cells[index] ?? "").trim().replace(/^"|"$/g, "");
    });
    return row;
  });
}

export default function ImportExportClient({
  products,
  categories,
}: {
  products: ExportableProduct[];
  categories: Category[];
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [jsonOutcome, setJsonOutcome] = useState<ImportOutcome | null>(null);
  const [csvOutcome, setCsvOutcome] = useState<ImportOutcome | null>(null);
  const [pending, setPending] = useState<"json" | "csv" | null>(null);

  async function submitImport(kind: "json" | "csv", rows: unknown[]) {
    setPending(kind);
    const formData = new FormData();
    formData.set("payload", JSON.stringify(rows));
    const result = await importProductsAction(formData);
    const message = result.ok
      ? `Applied ${result.created ?? 0} new and ${result.updated ?? 0} updated product(s).`
      : (result.error ??
        `Applied ${result.created ?? 0} new and ${result.updated ?? 0} updated with issues.`);
    const outcome = { ok: result.ok, message, details: result.failed };
    if (kind === "json") setJsonOutcome(outcome);
    else setCsvOutcome(outcome);
    setPending(null);
  }

  function handleJsonImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target?.result as string);
        const rows = Array.isArray(data) ? data : [data];
        void submitImport("json", rows);
      } catch {
        setJsonOutcome({ ok: false, message: "Invalid JSON file. Please check the file format." });
      }
    };
    reader.readAsText(file);
  }

  function handleCsvImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const rows = parseCsv(String(evt.target?.result ?? ""));
      if (rows.length === 0) {
        setCsvOutcome({
          ok: false,
          message: "CSV must have a header row and at least one data row.",
        });
        return;
      }
      const missing = ["id", "name", "slug"].filter((column) => !(column in rows[0]));
      if (missing.length > 0) {
        setCsvOutcome({
          ok: false,
          message: `Missing required columns: ${missing.join(", ")}. Found: ${Object.keys(rows[0]).join(", ")}`,
        });
        return;
      }
      void submitImport("csv", rows);
    };
    reader.readAsText(file);
  }

  function outcomeBlock(outcome: ImportOutcome | null) {
    if (!outcome) return null;
    return (
      <div
        className={`rounded px-3 py-2 text-xs ${
          outcome.ok ? "bg-emerald-600/10 text-emerald-400" : "bg-red-600/10 text-red-400"
        }`}
      >
        <p className="font-medium">
          {outcome.ok ? "✓" : "✗"} {outcome.message}
        </p>
        {outcome.details && outcome.details.length > 0 && (
          <ul className="mt-1 list-inside list-disc space-y-0.5">
            {outcome.details.slice(0, 10).map((detail, index) => (
              <li key={index}>{detail}</li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: "Admin", href: "/admin" },
            { label: "Store", href: "/admin/store" },
            { label: "Import/Export" },
          ]}
        />
      }
      subnav={<AdminSubnav current="store-import" />}
      title="Import & Export Tools"
      description={`Backed by the live catalog — ${products.length} product(s), ${categories.length} category(ies).`}
    >
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-white/10 bg-gradient-to-br from-[#0A1118]/80 to-[#0D1622]/80 p-5">
          <h3 className="mb-1 font-semibold text-slate-50">Export as JSON</h3>
          <p className="mb-4 text-sm text-slate-400">
            Download the live product catalog as a JSON file.
          </p>
          <button
            type="button"
            onClick={() =>
              download("products.json", JSON.stringify(products, null, 2), "application/json")
            }
            className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-emerald-500"
          >
            Download products.json
          </button>
          <button
            type="button"
            onClick={() =>
              download("categories.json", JSON.stringify(categories, null, 2), "application/json")
            }
            className="ml-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-200 transition hover:bg-white/10"
          >
            Download categories.json
          </button>
        </section>

        <section className="rounded-xl border border-white/10 bg-gradient-to-br from-[#0A1118]/80 to-[#0D1622]/80 p-5">
          <h3 className="mb-1 font-semibold text-slate-50">Export as CSV</h3>
          <p className="mb-4 text-sm text-slate-400">
            Export the live catalog as CSV for spreadsheet analysis.
          </p>
          <button
            type="button"
            onClick={() => {
              const rows = products.map((p) =>
                PRODUCT_CSV_HEADERS.map((header) =>
                  JSON.stringify(
                    String((p as unknown as Record<string, unknown>)[header] ?? ""),
                  ).replace(/,/g, ";"),
                ).join(","),
              );
              download(
                "products.csv",
                [PRODUCT_CSV_HEADERS.join(","), ...rows].join("\n"),
                "text/csv",
              );
            }}
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-200 transition hover:bg-white/10"
          >
            Download products.csv
          </button>
        </section>

        <section className="rounded-xl border border-white/10 bg-gradient-to-br from-[#0A1118]/80 to-[#0D1622]/80 p-5">
          <h3 className="mb-1 font-semibold text-slate-50">Import products from JSON</h3>
          <p className="mb-4 text-sm text-slate-400">
            Upload a JSON array of products. Existing ids are updated; new ids are created.
          </p>
          <form onSubmit={(e) => e.preventDefault()} className="space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleJsonImport}
              aria-label="Import JSON file"
              className="block w-full rounded border border-white/10 bg-cyber-base/60 px-3 py-2 text-sm text-slate-300 file:mr-3 file:rounded file:border-0 file:bg-emerald-600/20 file:px-3 file:py-1 file:text-xs file:font-medium file:text-emerald-400"
            />
            {pending === "json" && <p className="text-xs text-slate-400">Applying…</p>}
            {outcomeBlock(jsonOutcome)}
          </form>
        </section>

        <section className="rounded-xl border border-white/10 bg-gradient-to-br from-[#0A1118]/80 to-[#0D1622]/80 p-5">
          <h3 className="mb-1 font-semibold text-slate-50">Import products from CSV</h3>
          <p className="mb-4 text-sm text-slate-400">
            Upload a CSV with at least <code className="text-emerald-400">id</code>,{" "}
            <code className="text-emerald-400">name</code>, and{" "}
            <code className="text-emerald-400">slug</code> columns.
          </p>
          <form onSubmit={(e) => e.preventDefault()} className="space-y-3">
            <input
              type="file"
              accept=".csv"
              onChange={handleCsvImport}
              aria-label="Import CSV file"
              className="block w-full rounded border border-white/10 bg-cyber-base/60 px-3 py-2 text-sm text-slate-300 file:mr-3 file:rounded file:border-0 file:bg-emerald-600/20 file:px-3 file:py-1 file:text-xs file:font-medium file:text-emerald-400"
            />
            {pending === "csv" && <p className="text-xs text-slate-400">Applying…</p>}
            {outcomeBlock(csvOutcome)}
          </form>
        </section>

        <section className="rounded-xl border border-white/10 bg-gradient-to-br from-[#0A1118]/80 to-[#0D1622]/80 p-5 lg:col-span-2">
          <h3 className="mb-1 font-semibold text-slate-50">Import categories from JSON</h3>
          <p className="mb-4 text-sm text-slate-400">
            Upload a JSON array of categories. Existing ids are updated; new ids are created.
          </p>
          <form onSubmit={(e) => e.preventDefault()} className="space-y-3">
            <CategoryImport onApply={importCategoriesAction} />
          </form>
        </section>
      </div>
    </AdminPageShell>
  );
}

function CategoryImport({
  onApply,
}: {
  onApply: (formData: FormData) => Promise<{
    ok: boolean;
    error?: string;
    created?: number;
    updated?: number;
    failed?: string[];
  }>;
}) {
  const [outcome, setOutcome] = useState<ImportOutcome | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    let rows: unknown[];
    try {
      const parsed = JSON.parse(text);
      rows = Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      setOutcome({ ok: false, message: "Invalid JSON file." });
      return;
    }
    const formData = new FormData();
    formData.set("payload", JSON.stringify(rows));
    const result = await onApply(formData);
    setOutcome({
      ok: result.ok,
      message: result.ok
        ? `Applied ${result.created ?? 0} new and ${result.updated ?? 0} updated category(ies).`
        : (result.error ?? "Import completed with issues."),
      details: result.failed,
    });
  }

  return (
    <>
      <input
        type="file"
        accept=".json"
        onChange={handleFile}
        aria-label="Import categories JSON file"
        className="block w-full rounded border border-white/10 bg-cyber-base/60 px-3 py-2 text-sm text-slate-300 file:mr-3 file:rounded file:border-0 file:bg-emerald-600/20 file:px-3 file:py-1 file:text-xs file:font-medium file:text-emerald-400"
      />
      {outcome && (
        <div
          className={`rounded px-3 py-2 text-xs ${
            outcome.ok ? "bg-emerald-600/10 text-emerald-400" : "bg-red-600/10 text-red-400"
          }`}
        >
          <p className="font-medium">
            {outcome.ok ? "✓" : "✗"} {outcome.message}
          </p>
          {outcome.details && outcome.details.length > 0 && (
            <ul className="mt-1 list-inside list-disc space-y-0.5">
              {outcome.details.slice(0, 10).map((detail, index) => (
                <li key={index}>{detail}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </>
  );
}
