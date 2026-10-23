import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import SubmitButton from "@/components/SubmitButton";
import { addInsuranceEvidenceAction } from "../actions";

export const metadata = { title: "Add Insurance Evidence - Portal - Maine CyberTech" };

export default function NewInsuranceEvidencePage() {
  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Portal", href: "/portal/dashboard" },
          { label: "Insurance Evidence", href: "/portal/insurance-binder" },
          { label: "Add evidence" },
        ]}
      />
      <div>
        <h1 className="cyber-heading text-2xl">Add insurance evidence</h1>
        <p className="mt-2 text-sm text-slate-400">
          Record a policy, coverage area or evidence item. Your account team will verify it and
          attach the document.
        </p>
      </div>

      <form action={addInsuranceEvidenceAction} className="cyber-panel space-y-4">
        <div>
          <label htmlFor="ins-title" className="cyber-label">
            Title
          </label>
          <input
            id="ins-title"
            name="title"
            required
            className="cyber-input"
            placeholder="e.g. Cyber liability policy 2026"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="ins-area" className="cyber-label">
              Coverage area
            </label>
            <input id="ins-area" name="coverageArea" className="cyber-input" />
          </div>
          <div>
            <label htmlFor="ins-provider" className="cyber-label">
              Provider
            </label>
            <input id="ins-provider" name="insuranceProvider" className="cyber-input" />
          </div>
          <div>
            <label htmlFor="ins-policy" className="cyber-label">
              Policy number
            </label>
            <input id="ins-policy" name="policyNumber" className="cyber-input" />
          </div>
          <div>
            <label htmlFor="ins-expiry" className="cyber-label">
              Expiry date
            </label>
            <input id="ins-expiry" name="expiryDate" type="date" className="cyber-input" />
          </div>
        </div>

        <div>
          <label htmlFor="ins-description" className="cyber-label">
            Description
          </label>
          <textarea
            id="ins-description"
            name="description"
            rows={3}
            className="cyber-input"
            placeholder="Coverage limits, exclusions, or a note about the document."
          />
        </div>

        <div className="flex items-center gap-3">
          <SubmitButton className="cyber-button">Add evidence</SubmitButton>
          <Link href="/portal/insurance-binder" className="cyber-button-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
