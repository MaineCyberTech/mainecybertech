"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getClientApi } from "@/lib/client-api";

export default function CreateOrganizationForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [primaryDomain, setPrimaryDomain] = useState("");
  const [supportPlan, setSupportPlan] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setName(v);
    if (!slug || slug === autoSlug(name)) {
      setSlug(
        v
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, ""),
      );
    }
  }

  function autoSlug(v: string) {
    return v
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const org = await getClientApi().organizations.create({
        name: name.trim(),
        slug: slug.trim(),
        primaryDomain: primaryDomain.trim() || null,
        supportPlan: supportPlan.trim() || null,
      });
      router.push(`/admin/organizations/${org.id}`);
      router.refresh();
    } catch {
      setError("Failed to create organization. The slug may already be in use.");
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="cyber-button">
        New Organization
      </button>
    );
  }

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(false)} className="cyber-button-secondary">
        Cancel
      </button>
      <form
        onSubmit={handleSubmit}
        className="absolute right-0 top-12 z-40 w-80 space-y-3 rounded-lg border border-white/10 bg-[#0F172A] p-4 shadow-2xl"
      >
        <p className="text-sm font-semibold text-slate-100">New Organization</p>
        <div>
          <label
            htmlFor="org-name"
            className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400"
          >
            Name
          </label>
          <input
            id="org-name"
            type="text"
            required
            value={name}
            onChange={handleNameChange}
            className="cyber-input w-full"
            placeholder="e.g. Acme Manufacturing"
          />
        </div>
        <div>
          <label
            htmlFor="org-slug"
            className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400"
          >
            Slug
          </label>
          <input
            id="org-slug"
            type="text"
            required
            pattern="[a-z0-9-]+"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="cyber-input w-full"
            placeholder="acme"
          />
        </div>
        <div>
          <label
            htmlFor="org-domain"
            className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400"
          >
            Primary Domain
          </label>
          <input
            id="org-domain"
            type="text"
            value={primaryDomain}
            onChange={(e) => setPrimaryDomain(e.target.value)}
            className="cyber-input w-full"
            placeholder="acme.example"
          />
        </div>
        <div>
          <label
            htmlFor="org-plan"
            className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400"
          >
            Support Plan
          </label>
          <input
            id="org-plan"
            type="text"
            value={supportPlan}
            onChange={(e) => setSupportPlan(e.target.value)}
            className="cyber-input w-full"
            placeholder="Managed IT Standard"
          />
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
        <button type="submit" disabled={loading} className="cyber-button w-full">
          {loading ? "Creating..." : "Create Organization"}
        </button>
      </form>
    </div>
  );
}
