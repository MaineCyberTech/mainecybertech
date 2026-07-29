"use client";

import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import { getAllProducts } from "@/lib/catalog/loader";
import { useState, useRef } from "react";

type ValidationResult = {
  valid: boolean;
  message: string;
  details?: string[];
};

export default function ImportExportClient() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [jsonResult, setJsonResult] = useState<ValidationResult | null>(null);
  const [csvResult, setCsvResult] = useState<ValidationResult | null>(null);

  function handleJsonImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target?.result as string);
        const arr = Array.isArray(data) ? data : [data];
        const issues: string[] = [];
        for (const item of arr) {
          if (!item.id) issues.push(`Missing id: ${JSON.stringify(item).slice(0, 60)}`);
          if (!item.name) issues.push(`Missing name: ${item.id ?? "unknown"}`);
          if (!item.slug) issues.push(`Missing slug: ${item.id ?? "unknown"}`);
          if (!item.categoryId) issues.push(`Missing categoryId: ${item.id ?? "unknown"}`);
        }
        if (issues.length === 0) {
          setJsonResult({
            valid: true,
            message: `Valid JSON — ${arr.length} product(s) parsed successfully.`,
          });
        } else {
          setJsonResult({
            valid: false,
            message: `${issues.length} validation issue(s) found.`,
            details: issues,
          });
        }
      } catch {
        setJsonResult({
          valid: false,
          message: "Invalid JSON file. Please check the file format.",
        });
      }
    };
    reader.readAsText(file);
  }

  function handleCsvImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const lines = text.split("\n").filter(Boolean);
      if (lines.length < 2) {
        setCsvResult({
          valid: false,
          message: "CSV must have a header row and at least one data row.",
        });
        return;
      }
      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
      const required = ["id", "name", "slug"];
      const missing = required.filter((r) => !headers.includes(r));
      if (missing.length > 0) {
        setCsvResult({
          valid: false,
          message: `Missing required columns: ${missing.join(", ")}. Found: ${headers.join(", ")}`,
        });
        return;
      }
      setCsvResult({
        valid: true,
        message: `CSV looks valid — ${lines.length - 1} data row(s) with ${headers.length} column(s).`,
      });
    };
    reader.readAsText(file);
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
      description="Export catalog data or import products via JSON/CSV."
    >
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-white/10 bg-gradient-to-br from-[#0A1118]/80 to-[#0D1622]/80 p-5">
          <h3 className="mb-1 font-semibold text-slate-50">Export as JSON</h3>
          <p className="mb-4 text-sm text-slate-400">
            Download the full product catalog as a JSON file.
          </p>
          <button
            type="button"
            onClick={() => {
              const products = getAllProducts();
              const blob = new Blob([JSON.stringify(products, null, 2)], {
                type: "application/json",
              });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "products.json";
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-emerald-500"
          >
            Download products.json
          </button>
        </section>

        <section className="rounded-xl border border-white/10 bg-gradient-to-br from-[#0A1118]/80 to-[#0D1622]/80 p-5">
          <h3 className="mb-1 font-semibold text-slate-50">Export as CSV</h3>
          <p className="mb-4 text-sm text-slate-400">
            Export the catalog as CSV for spreadsheet analysis. Uses the same shared CSV helpers as
            ticket/project exports.
          </p>
          <button
            type="button"
            onClick={() => {
              const products = getAllProducts();
              const headers = [
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
              const rows = products.map((p) =>
                headers
                  .map((h) =>
                    JSON.stringify(
                      String((p as unknown as Record<string, unknown>)[h] ?? ""),
                    ).replace(/,/g, ";"),
                  )
                  .join(","),
              );
              const csv = [headers.join(","), ...rows].join("\n");
              const blob = new Blob([csv], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "products.csv";
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-200 transition hover:bg-white/10"
          >
            Download products.csv
          </button>
        </section>

        <section className="rounded-xl border border-white/10 bg-gradient-to-br from-[#0A1118]/80 to-[#0D1622]/80 p-5">
          <h3 className="mb-1 font-semibold text-slate-50">Import from JSON</h3>
          <p className="mb-4 text-sm text-slate-400">
            Upload a JSON file to validate product data. Client-side validation checks required
            fields.
          </p>
          <form onSubmit={(e) => e.preventDefault()} className="space-y-3">
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleJsonImport}
                className="block w-full rounded border border-white/10 bg-[#0A1118]/60 px-3 py-2 text-sm text-slate-300 file:mr-3 file:rounded file:border-0 file:bg-emerald-600/20 file:px-3 file:py-1 file:text-xs file:font-medium file:text-emerald-400"
              />
            </div>
            {jsonResult ? (
              <div
                className={`rounded px-3 py-2 text-xs ${
                  jsonResult.valid
                    ? "bg-emerald-600/10 text-emerald-400"
                    : "bg-red-600/10 text-red-400"
                }`}
              >
                <p className="font-medium">
                  {jsonResult.valid ? "✓" : "✗"} {jsonResult.message}
                </p>
                {jsonResult.details && jsonResult.details.length > 0 ? (
                  <ul className="mt-1 list-inside list-disc space-y-0.5">
                    {jsonResult.details.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}
          </form>
        </section>

        <section className="rounded-xl border border-white/10 bg-gradient-to-br from-[#0A1118]/80 to-[#0D1622]/80 p-5">
          <h3 className="mb-1 font-semibold text-slate-50">Import from CSV</h3>
          <p className="mb-4 text-sm text-slate-400">
            Upload a CSV file with at least <code className="text-emerald-400">id</code>,{" "}
            <code className="text-emerald-400">name</code>, and{" "}
            <code className="text-emerald-400">slug</code> columns.
          </p>
          <form onSubmit={(e) => e.preventDefault()} className="space-y-3">
            <div>
              <input
                type="file"
                accept=".csv"
                onChange={handleCsvImport}
                className="block w-full rounded border border-white/10 bg-[#0A1118]/60 px-3 py-2 text-sm text-slate-300 file:mr-3 file:rounded file:border-0 file:bg-emerald-600/20 file:px-3 file:py-1 file:text-xs file:font-medium file:text-emerald-400"
              />
            </div>
            {csvResult ? (
              <div
                className={`rounded px-3 py-2 text-xs ${
                  csvResult.valid
                    ? "bg-emerald-600/10 text-emerald-400"
                    : "bg-red-600/10 text-red-400"
                }`}
              >
                <p className="font-medium">
                  {csvResult.valid ? "✓" : "✗"} {csvResult.message}
                </p>
              </div>
            ) : null}
          </form>
        </section>
      </div>

      <section className="mt-8 rounded-xl border border-white/10 bg-gradient-to-br from-[#0A1118]/80 to-[#0D1622]/80 p-5">
        <h3 className="mb-3 font-semibold text-slate-50">About Data Persistence</h3>
        <div className="space-y-2 text-sm text-slate-400">
          <p>
            The catalog currently loads from static JSON files in{" "}
            <code className="text-emerald-400">lib/catalog/data/</code>. Changes made via import are
            validated client-side but <strong>not persisted</strong> to disk.
          </p>
          <p>
            A future database-backed implementation will store products, categories, and bundle
            rules in Supabase, with the import/export tools writing directly to the database.
          </p>
          <p className="text-xs text-slate-500">
            See <code className="text-emerald-400">docs/API_ENDPOINT_INVENTORY.md</code> for planned
            catalog API endpoints.
          </p>
        </div>
      </section>
    </AdminPageShell>
  );
}
