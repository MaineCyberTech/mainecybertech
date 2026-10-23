import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import PortalSubnav from "@/components/portal/PortalSubnav";
import { createApprovalAction } from "../actions";
import SubmitButton from "@/components/SubmitButton";

export const metadata = { title: "New Approval Request - Portal - Maine CyberTech" };

const REQUEST_TYPES = [
  { value: "access_request", label: "Access request" },
  { value: "change_request", label: "Change request" },
  { value: "purchase", label: "Purchase / procurement" },
  { value: "budget", label: "Budget approval" },
  { value: "other", label: "Other" },
];

export default function NewApprovalPage() {
  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Portal", href: "/portal/dashboard" },
          { label: "Approvals", href: "/portal/approvals" },
          { label: "New request" },
        ]}
      />
      <PortalSubnav current="approvals" />
      <div>
        <h1 className="cyber-heading text-2xl">New approval request</h1>
        <p className="mt-2 text-sm text-slate-400">
          Submit a decision request to your account team. You can track the status, comments and
          decision from the approvals list.
        </p>
      </div>

      <form action={createApprovalAction} className="cyber-panel space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="approval-type" className="cyber-label">
              Request type
            </label>
            <select
              id="approval-type"
              name="requestType"
              className="cyber-input"
              defaultValue="access_request"
            >
              {REQUEST_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="approval-priority" className="cyber-label">
              Priority
            </label>
            <select
              id="approval-priority"
              name="priority"
              className="cyber-input"
              defaultValue="normal"
            >
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="approval-subject" className="cyber-label">
            Subject
          </label>
          <input
            id="approval-subject"
            name="requestSubject"
            required
            maxLength={500}
            className="cyber-input"
            placeholder="What needs approval?"
          />
        </div>

        <div>
          <label htmlFor="approval-body" className="cyber-label">
            Details
          </label>
          <textarea
            id="approval-body"
            name="requestBody"
            rows={6}
            className="cyber-input"
            placeholder="Add context, links, cost, or the decision you need."
          />
        </div>

        <div className="max-w-xs">
          <label htmlFor="approval-due" className="cyber-label">
            Needed by
          </label>
          <input id="approval-due" name="dueAt" type="date" className="cyber-input" />
        </div>

        <div className="flex items-center gap-3">
          <SubmitButton className="cyber-button">Submit request</SubmitButton>
          <Link href="/portal/approvals" className="cyber-button-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
