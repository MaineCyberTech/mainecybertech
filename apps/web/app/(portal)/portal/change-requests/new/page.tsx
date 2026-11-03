import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import SubmitButton from "@/components/SubmitButton";
import { createChangeRequestAction } from "../actions";

export const metadata = { title: "New Change Request - Portal - Maine CyberTech" };

export default function NewChangeRequestPage() {
  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Portal", href: "/portal/dashboard" },
          { label: "Change Requests", href: "/portal/change-requests" },
          { label: "New request" },
        ]}
      />
      <div>
        <h1 className="cyber-heading text-2xl">New change request</h1>
        <p className="mt-2 text-sm text-slate-400">
          Describe the change, why it is needed, and how it can be rolled back. Your account team
          will review it through the change lifecycle.
        </p>
      </div>

      <form action={createChangeRequestAction} className="cyber-panel space-y-4">
        <div>
          <label htmlFor="change-title" className="cyber-label">
            Title
          </label>
          <input
            id="change-title"
            name="title"
            required
            maxLength={300}
            className="cyber-input"
            placeholder="e.g. Add new firewall rule for the warehouse VLAN"
          />
        </div>

        <div>
          <label htmlFor="change-description" className="cyber-label">
            Description
          </label>
          <textarea
            id="change-description"
            name="description"
            rows={4}
            className="cyber-input"
            placeholder="What is changing, and why?"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="change-type" className="cyber-label">
              Change type
            </label>
            <select
              id="change-type"
              name="changeType"
              className="cyber-input"
              defaultValue="standard"
            >
              <option value="standard">Standard</option>
              <option value="emergency">Emergency</option>
              <option value="major">Major</option>
            </select>
          </div>
          <div>
            <label htmlFor="change-risk" className="cyber-label">
              Risk level
            </label>
            <select id="change-risk" name="riskLevel" className="cyber-input" defaultValue="low">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="change-implementation" className="cyber-label">
            Planned implementation date
          </label>
          <input
            id="change-implementation"
            name="implementationDate"
            type="date"
            className="cyber-input max-w-xs"
          />
        </div>

        <div>
          <label htmlFor="change-rollback" className="cyber-label">
            Rollback plan
          </label>
          <textarea
            id="change-rollback"
            name="rollbackPlan"
            rows={3}
            className="cyber-input"
            placeholder="How would this be reverted if something goes wrong?"
          />
        </div>

        <div>
          <label htmlFor="change-verification" className="cyber-label">
            Verification steps
          </label>
          <textarea
            id="change-verification"
            name="verificationSteps"
            rows={3}
            className="cyber-input"
            placeholder="How will we confirm the change worked?"
          />
        </div>

        <div className="flex items-center gap-3">
          <SubmitButton className="cyber-button">Create draft</SubmitButton>
          <Link href="/portal/change-requests" className="cyber-button-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
