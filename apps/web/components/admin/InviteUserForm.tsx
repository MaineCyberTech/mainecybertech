"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getClientApi } from "@/lib/client-api";

type Org = { id: string; name: string };
type Role = { id: string; name: string };

export default function InviteUserForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [email, setEmail] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [roleId, setRoleId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const client = getClientApi();
    client.organizations
      .list()
      .then((data: any) => {
        setOrgs(data ?? []);
        if ((data ?? []).length > 0) setOrganizationId(data[0].id);
      })
      .catch(() => {});
    client.roles
      .list()
      .then((data: any) => {
        setRoles(data ?? []);
        const clientRole = (data ?? []).find((r: any) => r.key === "client_user");
        if (clientRole) setRoleId(clientRole.id);
        else if ((data ?? []).length > 0) setRoleId(data[0].id);
      })
      .catch(() => {});
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await getClientApi().memberships.invite({
        organizationId,
        email,
        roleId,
      });
      setSuccess(`Invite sent to ${email}`);
      setEmail("");
      router.refresh();
    } catch {
      setError("Failed to send invite. Check that the user exists and the org is valid.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="cyber-button">
        Invite User
      </button>
    );
  }

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(false)} className="cyber-button">
        Cancel
      </button>
      <form
        onSubmit={handleSubmit}
        className="absolute right-0 top-12 z-40 w-80 space-y-3 rounded-lg border border-white/10 bg-[#0F172A] p-4 shadow-2xl"
      >
        <p className="text-sm font-semibold text-slate-100">Invite User</p>
        <div>
          <label
            htmlFor="invite-email"
            className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400"
          >
            Email
          </label>
          <input
            id="invite-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="cyber-input w-full"
            placeholder="user@company.com"
          />
        </div>
        <div>
          <label
            htmlFor="invite-org"
            className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400"
          >
            Organization
          </label>
          <select
            id="invite-org"
            value={organizationId}
            onChange={(e) => setOrganizationId(e.target.value)}
            className="cyber-input w-full"
          >
            {orgs.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="invite-role"
            className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400"
          >
            Role
          </label>
          <select
            id="invite-role"
            value={roleId}
            onChange={(e) => setRoleId(e.target.value)}
            className="cyber-input w-full"
          >
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
        {success && <p className="text-xs text-emerald-400">{success}</p>}
        <button type="submit" disabled={loading} className="cyber-button w-full">
          {loading ? "Sending..." : "Send Invite"}
        </button>
      </form>
    </div>
  );
}
