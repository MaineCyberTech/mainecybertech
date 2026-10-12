"use client";

import { useState } from "react";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { updateMembership } from "./actions";

type RoleOption = { id: string; name: string; key?: string | null };

const REMOVES_ACCESS = new Set(["rejected", "suspended"]);

/**
 * USE-P2-010: membership role/status edits previously saved on a single click
 * with no confirmation and no result feedback. Saving a status that removes
 * access (rejected/suspended) now goes through the accessible ConfirmDialog,
 * and both success and failure render inline.
 */
export default function MembershipForm({
  membershipId,
  userId,
  organizationName,
  roleId,
  status,
  isBillingContact,
  isSecurityContact,
  allRoles,
}: {
  membershipId: string;
  userId: string;
  organizationName: string;
  roleId: string;
  status: string;
  isBillingContact: boolean;
  isSecurityContact: boolean;
  allRoles: RoleOption[];
}) {
  const [selectedStatus, setSelectedStatus] = useState(status);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<FormData | null>(null);

  async function save(formData: FormData) {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const result = await updateMembership(formData);
      if (!result.ok) {
        setError(result.error);
      } else {
        setMessage("Membership saved.");
      }
    } catch {
      setError("The membership could not be saved. Please try again.");
    } finally {
      setBusy(false);
      setConfirmOpen(false);
      setPendingFormData(null);
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const formData = new FormData(event.currentTarget);
    const nextStatus = String(formData.get("status"));
    if (REMOVES_ACCESS.has(nextStatus) && nextStatus !== status) {
      setPendingFormData(formData);
      setConfirmOpen(true);
      return;
    }
    void save(formData);
  }

  return (
    <form onSubmit={handleSubmit}>
      <input type="hidden" name="membershipId" value={membershipId} />
      <input type="hidden" name="userId" value={userId} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="cyber-label" htmlFor={`role-${membershipId}`}>
            Role
          </label>
          <select
            id={`role-${membershipId}`}
            name="roleId"
            defaultValue={roleId}
            className="cyber-input"
          >
            {allRoles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name} ({role.key})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="cyber-label" htmlFor={`status-${membershipId}`}>
            Status
          </label>
          <select
            id={`status-${membershipId}`}
            name="status"
            value={selectedStatus}
            onChange={(event) => setSelectedStatus(event.target.value)}
            className="cyber-input"
          >
            <option value="pending">pending</option>
            <option value="approved">approved</option>
            <option value="rejected">rejected</option>
            <option value="suspended">suspended</option>
          </select>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input type="checkbox" name="isBillingContact" defaultChecked={isBillingContact} />
          Billing Contact
        </label>

        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input type="checkbox" name="isSecurityContact" defaultChecked={isSecurityContact} />
          Security Contact
        </label>
      </div>

      <div className="mt-6">
        <button
          type="submit"
          disabled={busy}
          aria-busy={busy}
          className="cyber-button-secondary disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? "Saving…" : "Save Membership"}
        </button>
      </div>

      {message && (
        <p role="status" className="mt-3 text-sm text-emerald-300">
          {message}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-400">
          {error}
        </p>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Remove this user's access?"
        body={`Saving the membership in ${organizationName} as "${selectedStatus}" removes the user's access to that organization. This can be changed later by an administrator.`}
        confirmLabel="Save changes"
        danger
        onConfirm={() => {
          if (pendingFormData) void save(pendingFormData);
        }}
        onClose={() => {
          setConfirmOpen(false);
          setPendingFormData(null);
        }}
      />
    </form>
  );
}
