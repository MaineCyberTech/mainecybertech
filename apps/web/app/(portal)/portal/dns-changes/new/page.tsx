import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import SubmitButton from "@/components/SubmitButton";
import { createDnsChangeAction } from "../actions";

export const metadata = { title: "New DNS Change - Portal - Maine CyberTech" };

export default function NewDnsChangePage() {
  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Portal", href: "/portal/dashboard" },
          { label: "DNS Changes", href: "/portal/dns-changes" },
          { label: "New request" },
        ]}
      />
      <div>
        <h1 className="cyber-heading text-2xl">Request a DNS change</h1>
        <p className="mt-2 text-sm text-slate-400">
          Submit the record change for review. Your account team will validate and implement it.
        </p>
      </div>

      <form action={createDnsChangeAction} className="cyber-panel space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="dns-domain" className="cyber-label">
              Domain
            </label>
            <input
              id="dns-domain"
              name="domain"
              required
              className="cyber-input"
              placeholder="example.com"
            />
          </div>
          <div>
            <label htmlFor="dns-type" className="cyber-label">
              Record type
            </label>
            <select id="dns-type" name="changeType" className="cyber-input" defaultValue="a">
              {["a", "cname", "mx", "txt", "srv", "ns"].map((type) => (
                <option key={type} value={type}>
                  {type.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="dns-description" className="cyber-label">
            What needs to change?
          </label>
          <textarea
            id="dns-description"
            name="changeDescription"
            rows={3}
            className="cyber-input"
            placeholder="Add the new host, vendor, or record purpose."
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="dns-current" className="cyber-label">
              Current value
            </label>
            <input id="dns-current" name="currentValue" className="cyber-input" />
          </div>
          <div>
            <label htmlFor="dns-proposed" className="cyber-label">
              Proposed value
            </label>
            <input id="dns-proposed" name="proposedValue" className="cyber-input" />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <SubmitButton className="cyber-button">Submit request</SubmitButton>
          <Link href="/portal/dns-changes" className="cyber-button-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
