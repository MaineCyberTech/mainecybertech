"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { testLoginAction } from "@/lib/auth/auth-actions";
import { isTestAccountsEnabled } from "@/lib/test-accounts";

type TestAccount = {
  email: string;
  name: string;
  role: string;
  org: string;
  badge: string;
  badgeColor: string;
  status?: "pending" | "suspended";
  color: string;
};

const ACCOUNTS: TestAccount[] = [
  // MSP / platform
  {
    email: "superadmin.real@mainecybertech.local",
    name: "Julian Super Admin",
    role: "Global Super Admin",
    org: "All tenants",
    badge: "Super Admin",
    badgeColor: "#a855f7",
    color: "#7c3aed",
  },
  {
    email: "mspadmin.real@mainecybertech.local",
    name: "Morgan MSP Admin",
    role: "MSP Admin",
    org: "Acme · Northwind",
    badge: "Admin",
    badgeColor: "#3b82f6",
    color: "#2563eb",
  },
  {
    email: "aisha.johnson@mainecybertech.local",
    name: "Aisha Johnson",
    role: "Service Manager",
    org: "All tenants",
    badge: "Admin",
    badgeColor: "#3b82f6",
    color: "#d946ef",
  },
  {
    email: "jake.morrison@mainecybertech.local",
    name: "Jake Morrison",
    role: "Senior Technician",
    org: "Acme · Harborview · Brightline · Summit",
    badge: "Technician",
    badgeColor: "#f59e0b",
    color: "#ef4444",
  },
  {
    email: "carlos.rivera@mainecybertech.local",
    name: "Carlos Rivera",
    role: "NOC Engineer",
    org: "Northwind · Harborview · Brightline · Summit",
    badge: "Technician",
    badgeColor: "#f59e0b",
    color: "#06b6d4",
  },
  {
    email: "dmitri.petrov@mainecybertech.local",
    name: "Dmitri Petrov",
    role: "Security Engineer",
    org: "Acme · Harborview · Brightline · Summit",
    badge: "Technician",
    badgeColor: "#f59e0b",
    color: "#64748b",
  },
  {
    email: "nkechi.adeyemi@mainecybertech.local",
    name: "Nkechi Adeyemi",
    role: "Client Success Manager",
    org: "Northwind · Summit",
    badge: "Client User",
    badgeColor: "#10b981",
    color: "#84cc16",
  },
  // Acme Manufacturing
  {
    email: "clientadmin.real@acme.example",
    name: "Avery Client Admin",
    role: "Operations Director",
    org: "Acme Manufacturing",
    badge: "Client Admin",
    badgeColor: "#10b981",
    color: "#3b82f6",
  },
  {
    email: "technician.real@acme.example",
    name: "Taylor Technician",
    role: "Systems Technician",
    org: "Acme Manufacturing",
    badge: "Technician",
    badgeColor: "#f59e0b",
    color: "#ef4444",
  },
  {
    email: "user.real@acme.example",
    name: "Casey Client User",
    role: "Operations Coordinator",
    org: "Acme Manufacturing",
    badge: "Client User",
    badgeColor: "#10b981",
    color: "#8b5cf6",
  },
  {
    email: "omar.farouk@acme.example",
    name: "Omar Farouk",
    role: "IT Coordinator",
    org: "Acme Manufacturing",
    badge: "Client Admin",
    badgeColor: "#10b981",
    color: "#0d9488",
  },
  // Northwind Legal
  {
    email: "clientadmin.real@beta.example",
    name: "Blake Client Admin",
    role: "Managing Partner",
    org: "Northwind Legal",
    badge: "Client Admin",
    badgeColor: "#10b981",
    color: "#2563eb",
  },
  {
    email: "user.real@beta.example",
    name: "Jordan Client User",
    role: "Office Manager",
    org: "Northwind Legal",
    badge: "Client User",
    badgeColor: "#10b981",
    color: "#f59e0b",
  },
  {
    email: "nora.berg@northwind.example",
    name: "Nora Berg",
    role: "Logistics Analyst",
    org: "Northwind Legal",
    badge: "Client User",
    badgeColor: "#10b981",
    color: "#ca8a04",
  },
  // Harborview Health Systems
  {
    email: "hannah.reyes@harborview.example",
    name: "Dr. Hannah Reyes",
    role: "IT Director",
    org: "Harborview Health Systems",
    badge: "Client Admin",
    badgeColor: "#10b981",
    color: "#0ea5e9",
  },
  {
    email: "marcus.chen@harborview.example",
    name: "Marcus Chen",
    role: "Network Administrator",
    org: "Harborview Health Systems",
    badge: "Client User",
    badgeColor: "#10b981",
    color: "#3b82f6",
  },
  {
    email: "priya.sharma@harborview.example",
    name: "Priya Sharma",
    role: "Compliance Officer",
    org: "Harborview Health Systems",
    badge: "Client User",
    badgeColor: "#10b981",
    color: "#8b5cf6",
  },
  {
    email: "tom.nguyen@harborview.example",
    name: "Tom Nguyen",
    role: "Systems Analyst",
    org: "Harborview Health Systems",
    badge: "Client User",
    badgeColor: "#10b981",
    color: "#06b6d4",
  },
  {
    email: "fatima.al-rashid@harborview.example",
    name: "Fatima Al-Rashid",
    role: "Security Analyst",
    org: "Harborview Health Systems",
    badge: "Client User",
    badgeColor: "#10b981",
    status: "pending",
    color: "#ec4899",
  },
  {
    email: "dani.calderon@harborview.example",
    name: "Dani Calderon",
    role: "On-Site Engineer",
    org: "Harborview Health Systems",
    badge: "Technician",
    badgeColor: "#f59e0b",
    color: "#22c55e",
  },
  // Brightline Retail Group
  {
    email: "sarah.patel@brightline.example",
    name: "Sarah Patel",
    role: "VP of IT",
    org: "Brightline Retail Group",
    badge: "Client Admin",
    badgeColor: "#10b981",
    color: "#ef4444",
  },
  {
    email: "tyler.brooks@brightline.example",
    name: "Tyler Brooks",
    role: "Store Systems Lead",
    org: "Brightline Retail Group",
    badge: "Client User",
    badgeColor: "#10b981",
    color: "#f59e0b",
  },
  {
    email: "mei.lin@brightline.example",
    name: "Mei Lin",
    role: "Data Analyst",
    org: "Brightline Retail Group",
    badge: "Client User",
    badgeColor: "#10b981",
    color: "#f97316",
  },
  {
    email: "liam.obrien@brightline.example",
    name: "Liam O'Brien",
    role: "POS Support Engineer",
    org: "Brightline Retail Group",
    badge: "Client User",
    badgeColor: "#10b981",
    color: "#14b8a6",
  },
  {
    email: "jamal.williams@brightline.example",
    name: "Jamal Williams",
    role: "Field Technician",
    org: "Brightline Retail Group",
    badge: "Client User",
    badgeColor: "#10b981",
    status: "suspended",
    color: "#65a30d",
  },
  {
    email: "ravi.mehta@brightline.example",
    name: "Ravi Mehta",
    role: "IT Manager (Suspended)",
    org: "Brightline Retail Group",
    badge: "Client Admin",
    badgeColor: "#10b981",
    status: "suspended",
    color: "#dc2626",
  },
  // Summit Financial Advisors
  {
    email: "elena.volkov@summit.example",
    name: "Elena Volkov",
    role: "Managing Director",
    org: "Summit Financial Advisors",
    badge: "Client Admin",
    badgeColor: "#10b981",
    color: "#8b5cf6",
  },
  {
    email: "raj.gupta@summit.example",
    name: "Raj Gupta",
    role: "Wealth Manager",
    org: "Summit Financial Advisors",
    badge: "Client User",
    badgeColor: "#10b981",
    color: "#e11d48",
  },
  {
    email: "sofia.rodriguez@summit.example",
    name: "Sofia Rodriguez",
    role: "Operations Manager",
    org: "Summit Financial Advisors",
    badge: "Client User",
    badgeColor: "#10b981",
    color: "#ea580c",
  },
  {
    email: "chen.wei@summit.example",
    name: "Chen Wei",
    role: "Security Analyst",
    org: "Summit Financial Advisors",
    badge: "Client User",
    badgeColor: "#10b981",
    color: "#0891b2",
  },
  {
    email: "olivia.foster@summit.example",
    name: "Olivia Foster",
    role: "Compliance Analyst",
    org: "Summit Financial Advisors",
    badge: "Client User",
    badgeColor: "#10b981",
    status: "pending",
    color: "#c026d3",
  },
  {
    email: "grace.liu@summit.example",
    name: "Grace Liu",
    role: "Compliance Associate",
    org: "Summit Financial Advisors",
    badge: "Client User",
    badgeColor: "#10b981",
    color: "#7c3aed",
  },
  // Permission edge cases
  {
    email: "paige.norton@westbrook.example",
    name: "Paige Norton",
    role: "Office Manager",
    org: "Westbrook Dental",
    badge: "Client User",
    badgeColor: "#10b981",
    status: "pending",
    color: "#94a3b8",
  },
  {
    email: "devon.marsh@acme.example",
    name: "Devon Marsh",
    role: "IT Consultant",
    org: "Acme · Northwind",
    badge: "Client Admin",
    badgeColor: "#10b981",
    color: "#059669",
  },
  {
    email: "ines.ribeiro@harborview.example",
    name: "Ines Ribeiro",
    role: "Compliance Director",
    org: "Harborview Health Systems",
    badge: "Client Admin",
    badgeColor: "#10b981",
    color: "#be123c",
  },
  {
    email: "theo.novak@brightline.example",
    name: "Theo Novak",
    role: "On-Site Technician",
    org: "Brightline Retail Group",
    badge: "Technician",
    badgeColor: "#f59e0b",
    color: "#0f766e",
  },
  {
    email: "wren.callahan@summit.example",
    name: "Wren Callahan",
    role: "Office Coordinator",
    org: "Summit Financial Advisors",
    badge: "Client User",
    badgeColor: "#10b981",
    color: "#a21caf",
  },
];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export default function TestAccountsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isTestAccountsEnabled()) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0A1118] px-6">
        <div className="text-center">
          <h1 className="text-xl font-bold text-slate-100">Not Available</h1>
          <p className="mt-2 text-sm text-slate-400">
            Test accounts are disabled in this environment.
          </p>
          <p className="mt-3">
            <Link
              href="/login"
              className="text-sm text-emerald-400 underline-offset-4 hover:underline"
            >
              Back to login
            </Link>
          </p>
        </div>
      </main>
    );
  }

  async function handleLogin(email: string) {
    setLoading(email);
    setError(null);
    try {
      const result = await testLoginAction(
        email,
        process.env.NEXT_PUBLIC_TEST_ACCOUNT_PASSWORD ?? "1",
      );
      if (!result.ok) {
        setError(result.error);
        setLoading(null);
        return;
      }
      router.push(result.redirectTo);
      router.refresh();
    } catch {
      setError("Login failed. Is the API dev server running?");
      setLoading(null);
    }
  }

  return (
    <main className="min-h-screen overflow-y-auto bg-[#0A1118]">
      <div className="mx-auto max-w-5xl px-4 py-12">
        <div className="mb-8 text-center">
          <h1 className="font-orbitron text-3xl font-bold uppercase tracking-[0.1em] text-slate-100">
            Test Accounts
          </h1>
          <p className="mt-3 text-sm text-slate-400">
            Click any account to sign in automatically. Password:{" "}
            <code className="rounded bg-emerald-600/15 px-1.5 py-0.5 font-mono text-xs text-emerald-400">
              {process.env.NEXT_PUBLIC_TEST_ACCOUNT_PASSWORD ?? "1"}
            </code>
          </p>
        </div>

        {error && (
          <div className="mx-auto mb-6 max-w-md rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ACCOUNTS.map((account) => (
            <button
              key={account.email}
              onClick={() => handleLogin(account.email)}
              disabled={loading !== null}
              className="group flex items-center gap-3 rounded-lg border border-white/10 bg-[#0F172A]/70 p-4 text-left transition hover:border-emerald-600/30 hover:bg-[#0F172A] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <div
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
                style={{ backgroundColor: account.color }}
              >
                {loading === account.email ? (
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                ) : (
                  getInitials(account.name)
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <div className="truncate text-sm font-medium text-slate-100">{account.name}</div>
                  {account.status ? (
                    <span
                      className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                        account.status === "pending"
                          ? "bg-amber-500/15 text-amber-400"
                          : "bg-red-500/15 text-red-400"
                      }`}
                    >
                      {account.status}
                    </span>
                  ) : null}
                </div>
                <div className="truncate text-xs text-slate-400">{account.role}</div>
                <div className="mt-1.5 flex flex-wrap items-center gap-1">
                  <span
                    className="inline-block rounded px-1.5 py-0.5 text-[10px] font-medium text-white"
                    style={{ backgroundColor: account.badgeColor }}
                  >
                    {account.badge}
                  </span>
                  <span className="inline-block rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-300">
                    {account.org}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-8 flex justify-center gap-6 text-center">
          <Link
            href="/login"
            className="text-sm text-emerald-400 underline-offset-4 hover:underline"
          >
            Back to login
          </Link>
          <Link
            href="/signup"
            className="text-sm text-slate-400 underline-offset-4 hover:underline"
          >
            Create an account
          </Link>
        </div>
      </div>
    </main>
  );
}
