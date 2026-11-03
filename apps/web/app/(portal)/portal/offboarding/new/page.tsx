import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import SubmitButton from "@/components/SubmitButton";
import { requestOffboardingAction } from "../actions";

export const metadata = { title: "Request Offboarding - Portal - Maine CyberTech" };

export default function NewOffboardingPage() {
  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Portal", href: "/portal/dashboard" },
          { label: "Offboarding", href: "/portal/offboarding" },
          { label: "New request" },
        ]}
      />
      <div>
        <h1 className="cyber-heading text-2xl">Request employee offboarding</h1>
        <p className="mt-2 text-sm text-slate-400">
          Start the account, mailbox, OneDrive, license and access-review checklist for a departing
          employee.
        </p>
      </div>

      <form action={requestOffboardingAction} className="cyber-panel space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="off-name" className="cyber-label">
              Employee name
            </label>
            <input id="off-name" name="employeeName" required className="cyber-input" />
          </div>
          <div>
            <label htmlFor="off-email" className="cyber-label">
              Employee email
            </label>
            <input id="off-email" name="employeeEmail" type="email" className="cyber-input" />
          </div>
          <div>
            <label htmlFor="off-dept" className="cyber-label">
              Department
            </label>
            <input id="off-dept" name="department" className="cyber-input" />
          </div>
          <div>
            <label htmlFor="off-date" className="cyber-label">
              Last working day
            </label>
            <input id="off-date" name="offboardingDate" type="date" className="cyber-input" />
          </div>
        </div>

        <div>
          <label htmlFor="off-notes" className="cyber-label">
            Notes
          </label>
          <textarea
            id="off-notes"
            name="notes"
            rows={3}
            className="cyber-input"
            placeholder="Manager, device return details, forwarding address, special handling…"
          />
        </div>

        <div className="flex items-center gap-3">
          <SubmitButton className="cyber-button">Start offboarding</SubmitButton>
          <Link href="/portal/offboarding" className="cyber-button-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
