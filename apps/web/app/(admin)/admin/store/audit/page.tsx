"use client";

import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import { validateCatalog } from "@/lib/catalog/validation";
import { useState, useCallback } from "react";
import type { CatalogHealthReport, CatalogValidationIssue } from "@/lib/catalog/types";

function groupIssues(issues: CatalogValidationIssue[]) {
  const groups: Record<string, { severity: string; issues: CatalogValidationIssue[] }> = {};
  for (const iss of issues) {
    const key = iss.type;
    if (!groups[key]) groups[key] = { severity: iss.severity, issues: [] };
    groups[key].issues.push(iss);
  }
  return groups;
}

export default function StoreAuditClient() {
  const [report, setReport] = useState<CatalogHealthReport | null>(null);
  const [ran, setRan] = useState(false);

  const runValidation = useCallback(() => {
    const r = validateCatalog();
    setReport(r);
    setRan(true);
  }, []);

  const errorCount = report ? report.issues.filter((i) => i.severity === "error").length : 0;
  const warningCount = report ? report.issues.filter((i) => i.severity === "warning").length : 0;
  const infoCount = report ? report.issues.filter((i) => i.severity === "info").length : 0;
  const total = report ? report.issues.length : 0;
  const passed = total === 0;

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: "Admin", href: "/admin" },
            { label: "Store", href: "/admin/store" },
            { label: "Audit" },
          ]}
        />
      }
      subnav={<AdminSubnav current="store-audit" />}
      title="Catalog Validation & Audit"
      description="Run validation checks against the product catalog to find issues."
      actions={
        <button
          type="button"
          onClick={runValidation}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-emerald-500"
        >
          Run Validation
        </button>
      }
    >
      {!ran ? (
        <div className="mt-8 flex flex-col items-center gap-4 py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-[#0A1118]/60 text-3xl">
            🔍
          </div>
          <p className="text-slate-400">
            Click <strong className="text-emerald-400">Run Validation</strong> to check the catalog
            for issues.
          </p>
        </div>
      ) : passed ? (
        <div className="mt-8 flex flex-col items-center gap-4 py-16 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-600/20">
            <svg
              className="h-10 w-10 text-emerald-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-50">All Checks Passed</h2>
          <p className="text-sm text-slate-400">No issues found in the catalog.</p>
        </div>
      ) : (
        <>
          <div className="mb-6 mt-6 grid grid-cols-4 gap-3">
            <div className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-3 text-center">
              <p className="text-2xl font-bold text-slate-50">{total}</p>
              <p className="text-xs text-slate-500">Total</p>
            </div>
            <div className="rounded-lg border border-emerald-600/20 bg-emerald-600/5 p-3 text-center">
              <p className="text-2xl font-bold text-emerald-400">
                {total - errorCount - warningCount - infoCount}
              </p>
              <p className="text-xs text-emerald-500/70">Passed</p>
            </div>
            <div className="rounded-lg border border-amber-600/20 bg-amber-600/5 p-3 text-center">
              <p className="text-2xl font-bold text-amber-400">{warningCount}</p>
              <p className="text-xs text-amber-500/70">
                {warningCount === 1 ? "Warning" : "Warnings"}
              </p>
            </div>
            <div className="rounded-lg border border-red-600/20 bg-red-600/5 p-3 text-center">
              <p className="text-2xl font-bold text-red-400">{errorCount}</p>
              <p className="text-xs text-red-500/70">{errorCount === 1 ? "Error" : "Errors"}</p>
            </div>
          </div>

          {report && (
            <div className="space-y-4">
              {Object.entries(groupIssues(report.issues)).map(([type, group]) => {
                const isError = group.severity === "error";
                const isWarning = group.severity === "warning";
                const Icon = isError
                  ? () => <span className="text-red-400">✗</span>
                  : isWarning
                    ? () => <span className="text-amber-400">⚠</span>
                    : () => <span className="text-slate-400">ℹ</span>;
                return (
                  <section
                    key={type}
                    className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4"
                  >
                    <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-200">
                      <Icon />
                      <span className="font-mono text-xs text-slate-500">{type}</span>
                      <span className="ml-auto rounded bg-white/5 px-2 py-0.5 text-[11px] text-slate-500">
                        {group.issues.length}
                      </span>
                    </h3>
                    <ul className="space-y-1">
                      {group.issues.map((iss, i) => (
                        <li
                          key={i}
                          className={`flex items-start gap-2 rounded px-2 py-1 text-xs ${
                            isError
                              ? "bg-red-600/5 text-red-300"
                              : isWarning
                                ? "bg-amber-600/5 text-amber-300"
                                : "bg-white/5 text-slate-400"
                          }`}
                        >
                          <span className="mt-0.5 shrink-0">
                            {isError ? "✗" : isWarning ? "⚠" : "ℹ"}
                          </span>
                          <span className="flex-1">{iss.message}</span>
                          {iss.field ? (
                            <span className="shrink-0 font-mono text-[10px] text-slate-600">
                              {iss.field}
                            </span>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </section>
                );
              })}
            </div>
          )}
        </>
      )}
    </AdminPageShell>
  );
}
