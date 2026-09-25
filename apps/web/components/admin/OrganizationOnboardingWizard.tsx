"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getClientApi } from "@/lib/client-api";
import type { Role } from "@mct/sdk";

type Step = 0 | 1 | 2 | 3;

interface FormState {
  name: string;
  slug: string;
  primaryDomain: string;
  supportPlan: string;
  adminEmail: string;
  adminFullName: string;
  adminRoleKey: string;
}

const EMPTY: FormState = {
  name: "",
  slug: "",
  primaryDomain: "",
  supportPlan: "",
  adminEmail: "",
  adminFullName: "",
  adminRoleKey: "client_admin",
};

function autoSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const STEP_LABELS = ["Organization", "Admin User", "Confirm"];

export default function OrganizationOnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(0);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);

  useEffect(() => {
    getClientApi()
      .roles.list()
      .then((data) => {
        setRoles(data ?? []);
        if (data?.length) {
          const clientAdmin = data.find((r) => r.key === "client_admin");
          setForm((f) => ({
            ...f,
            adminRoleKey: clientAdmin?.key ?? data[0].key,
          }));
        }
      })
      .catch(() => {
        setError("Failed to load roles. You can still continue.");
      });
  }, []);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleNameChange(value: string) {
    setForm((f) => ({
      ...f,
      name: value,
      slug: f.slug === autoSlug(f.name) || !f.slug ? autoSlug(value) : f.slug,
    }));
  }

  function validateStep(current: Step): string | null {
    if (current === 0) {
      if (!form.name.trim()) return "Organization name is required.";
      if (!/^[a-z0-9-]+$/.test(form.slug.trim()))
        return "Slug must be lowercase alphanumeric with hyphens.";
    }
    if (current === 1) {
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.adminEmail.trim()))
        return "A valid admin email is required.";
      if (!form.adminRoleKey) return "Select an admin role.";
    }
    return null;
  }

  function next() {
    const err = validateStep(step);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setStep((s) => (s + 1) as Step);
  }

  function back() {
    setError(null);
    setStep((s) => (s - 1) as Step);
  }

  async function submit() {
    const err = validateStep(0) ?? validateStep(1);
    if (err) {
      setError(err);
      setStep(0);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await getClientApi().organizations.onboard({
        name: form.name.trim(),
        slug: form.slug.trim(),
        primaryDomain: form.primaryDomain.trim() || null,
        supportPlan: form.supportPlan.trim() || null,
        adminEmail: form.adminEmail.trim(),
        adminFullName: form.adminFullName.trim() || null,
        adminRoleKey: form.adminRoleKey,
      });
      setCreatedId(result.organization.id);
      setStep(3);
    } catch {
      setError("Onboarding failed. The slug may already be in use or the admin email is invalid.");
    } finally {
      setLoading(false);
    }
  }

  if (step === 3 && createdId) {
    return (
      <div className="space-y-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-6">
        <h2 className="text-lg font-semibold text-emerald-300">Organization onboarded</h2>
        <p className="text-sm text-slate-300">
          {form.name} was created and its first admin was invited.
        </p>
        <div className="flex gap-3">
          <Link href={`/admin/organizations/${createdId}`} className="cyber-button">
            View organization
          </Link>
          <button
            type="button"
            onClick={() => {
              setForm(EMPTY);
              setCreatedId(null);
              setStep(0);
              router.refresh();
            }}
            className="cyber-button-secondary"
          >
            Onboard another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ol className="flex gap-4 text-xs font-semibold uppercase tracking-wider">
        {STEP_LABELS.map((label, i) => (
          <li
            key={label}
            className={
              i === step ? "text-cyan-400" : i < step ? "text-slate-300" : "text-slate-500"
            }
          >
            {i + 1}. {label}
          </li>
        ))}
      </ol>

      {error && (
        <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      {step === 0 && (
        <div className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400"
            >
              Organization name
            </label>
            <input
              id="name"
              type="text"
              required
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="cyber-input w-full"
              placeholder="e.g. Acme Manufacturing"
            />
          </div>
          <div>
            <label
              htmlFor="slug"
              className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400"
            >
              Slug
            </label>
            <input
              id="slug"
              type="text"
              required
              pattern="[a-z0-9-]+"
              value={form.slug}
              onChange={(e) => update("slug", e.target.value)}
              className="cyber-input w-full"
              placeholder="acme"
            />
          </div>
          <div>
            <label
              htmlFor="primaryDomain"
              className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400"
            >
              Primary domain
            </label>
            <input
              id="primaryDomain"
              type="text"
              value={form.primaryDomain}
              onChange={(e) => update("primaryDomain", e.target.value)}
              className="cyber-input w-full"
              placeholder="acme.example"
            />
          </div>
          <div>
            <label
              htmlFor="supportPlan"
              className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400"
            >
              Support plan
            </label>
            <input
              id="supportPlan"
              type="text"
              value={form.supportPlan}
              onChange={(e) => update("supportPlan", e.target.value)}
              className="cyber-input w-full"
              placeholder="Managed IT Standard"
            />
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label
              htmlFor="adminEmail"
              className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400"
            >
              Admin email
            </label>
            <input
              id="adminEmail"
              type="email"
              required
              value={form.adminEmail}
              onChange={(e) => update("adminEmail", e.target.value)}
              className="cyber-input w-full"
              placeholder="admin@client.example"
            />
            <p className="mt-1 text-xs text-slate-500">
              If no account exists, an invitation email is sent. Otherwise the existing user
              becomes the org admin.
            </p>
          </div>
          <div>
            <label
              htmlFor="adminFullName"
              className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400"
            >
              Admin full name
            </label>
            <input
              id="adminFullName"
              type="text"
              value={form.adminFullName}
              onChange={(e) => update("adminFullName", e.target.value)}
              className="cyber-input w-full"
              placeholder="Jane Doe"
            />
          </div>
          <div>
            <label
              htmlFor="adminRoleKey"
              className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400"
            >
              Admin role
            </label>
            <select
              id="adminRoleKey"
              value={form.adminRoleKey}
              onChange={(e) => update("adminRoleKey", e.target.value)}
              className="cyber-input w-full"
            >
              {roles.length === 0 ? (
                <option value={form.adminRoleKey}>{form.adminRoleKey}</option>
              ) : (
                roles.map((r) => (
                  <option key={r.id} value={r.key}>
                    {r.name} ({r.key})
                  </option>
                ))
              )}
            </select>
          </div>
        </div>
      )}

      {step === 2 && (
        <dl className="space-y-2 rounded-lg border border-white/10 bg-slate-900/50 p-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-400">Name</dt>
            <dd className="text-slate-100">{form.name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-400">Slug</dt>
            <dd className="text-slate-100">{form.slug}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-400">Primary domain</dt>
            <dd className="text-slate-100">{form.primaryDomain || "—"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-400">Support plan</dt>
            <dd className="text-slate-100">{form.supportPlan || "—"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-400">Admin email</dt>
            <dd className="text-slate-100">{form.adminEmail}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-400">Admin full name</dt>
            <dd className="text-slate-100">{form.adminFullName || "—"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-400">Admin role</dt>
            <dd className="text-slate-100">{form.adminRoleKey}</dd>
          </div>
        </dl>
      )}

      <div className="flex justify-between">
        <button
          type="button"
          onClick={back}
          disabled={step === 0 || loading}
          className="cyber-button-secondary disabled:opacity-40"
        >
          Back
        </button>
        {step < 2 ? (
          <button type="button" onClick={next} className="cyber-button">
            Next
          </button>
        ) : (
          <button type="button" onClick={submit} disabled={loading} className="cyber-button">
            {loading ? "Onboarding..." : "Create organization"}
          </button>
        )}
      </div>
    </div>
  );
}
