import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import SubmitButton from "@/components/SubmitButton";
import { requestIdentityVerificationAction } from "../actions";

export const metadata = { title: "Request Identity Verification - Portal - Maine CyberTech" };

export default function NewIdentityVerificationPage() {
  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Portal", href: "/portal/dashboard" },
          { label: "Identity Verification", href: "/portal/identity-verification" },
          { label: "New request" },
        ]}
      />
      <div>
        <h1 className="cyber-heading text-2xl">Request identity verification</h1>
        <p className="mt-2 text-sm text-slate-400">
          Use this when someone contacts you claiming to be from Maine CyberTech and asks for
          access, credentials, or a change. We will verify the request through a separate channel.
        </p>
      </div>

      <form action={requestIdentityVerificationAction} className="cyber-panel space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="idv-name" className="cyber-label">
              Person requesting access
            </label>
            <input id="idv-name" name="requestorName" required className="cyber-input" />
          </div>
          <div>
            <label htmlFor="idv-email" className="cyber-label">
              Their email / phone
            </label>
            <input id="idv-email" name="requestorEmail" className="cyber-input" />
          </div>
        </div>

        <div>
          <label htmlFor="idv-method" className="cyber-label">
            Preferred verification method
          </label>
          <select
            id="idv-method"
            name="verificationMethod"
            className="cyber-input"
            defaultValue="callback"
          >
            <option value="callback">Call back a known number</option>
            <option value="email">Reply from a known email</option>
            <option value="in_person">In person</option>
            <option value="video">Video call</option>
          </select>
        </div>

        <div>
          <label htmlFor="idv-action" className="cyber-label">
            What are they asking for?
          </label>
          <textarea
            id="idv-action"
            name="actionAuthorized"
            rows={3}
            className="cyber-input"
            placeholder="e.g. reset a password, provide a code, change a firewall rule"
          />
        </div>

        <div className="flex items-center gap-3">
          <SubmitButton className="cyber-button">Submit request</SubmitButton>
          <Link href="/portal/identity-verification" className="cyber-button-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
