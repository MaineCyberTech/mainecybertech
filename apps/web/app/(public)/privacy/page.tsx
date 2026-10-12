import type { Metadata } from "next";
import Breadcrumbs from "../../../components/Breadcrumbs";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export const dynamic = "force-dynamic";

export default function PrivacyPage() {
  return (
    <section className="min-h-screen px-4 pb-20 pt-32 sm:px-6 sm:pt-40">
      <div className="mx-auto max-w-4xl">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Privacy Policy" }]} />

        <h1 className="font-display text-4xl font-bold uppercase tracking-wider text-slate-50 sm:text-5xl">
          Privacy <span className="text-emerald-500">Policy</span>
        </h1>
        <p className="mt-4 text-sm text-slate-500">Last updated: October 11, 2026</p>

        <div className="cyber-panel mt-10 space-y-8">
          <section>
            <h2 className="cybergreen font-display text-xl font-bold uppercase tracking-wider">
              Information We Collect
            </h2>
            <p className="cyber-text mt-3 leading-relaxed">
              When you fill out our contact form, we collect your name, email address, phone number,
              company name, and any message you provide. We also collect limited technical
              information to operate the site, such as the referring page and your browser platform.
              Your IP address, geolocation and browser details are collected only after you accept
              analytics; before that, the visitor session used by our forms contains no IP address.
            </p>
          </section>

          <section>
            <h2 className="cybergreen font-display text-xl font-bold uppercase tracking-wider">
              How We Use Your Information
            </h2>
            <p className="cyber-text mt-3 leading-relaxed">
              We use the information we collect to respond to your service inquiries, provide
              technical support, deliver managed IT and cybersecurity services, improve our website,
              and communicate with you about our offerings. If you have opted in, we may send
              marketing communications related to our services.
            </p>
          </section>

          <section>
            <h2 className="cybergreen font-display text-xl font-bold uppercase tracking-wider">
              Data Sharing with Third Parties
            </h2>
            <p className="cyber-text mt-3 leading-relaxed">
              We do not sell your personal information. We share data with trusted third-party
              service providers who help us operate our business, as described below:
            </p>
            <ul className="cyber-text mt-4 list-disc space-y-2 pl-6">
              <li>
                <strong className="text-slate-200">Google Analytics</strong> &mdash; We use Google
                Analytics to understand how visitors interact with our website. This includes
                anonymized usage data and cookies. Google may process this data as described in
                their privacy policy.
              </li>
              <li>
                <strong className="text-slate-200">Tawk.to</strong> &mdash; We use Tawk.to to
                provide live chat support. Messages, IP addresses, and browsing context may be
                processed by Tawk.to.
              </li>
              <li>
                <strong className="text-slate-200">Microsoft Teams</strong> &mdash; Contact form
                submissions are forwarded to our internal Microsoft Teams channel for lead tracking
                and response coordination.
              </li>
              <li>
                <strong className="text-slate-200">Atlassian JSM (Jira Service Management)</strong>
                &mdash; Submitted requests may create tickets in our JSM project for tracking and
                fulfillment.
              </li>
              <li>
                <strong className="text-slate-200">ip-api.com</strong> &mdash; We use ip-api.com to
                geolocate visitors who have accepted analytics. The lookup is only made after
                consent and over HTTPS. No data is permanently stored by ip-api.com.
              </li>
              <li>
                <strong className="text-slate-200">Supabase</strong> &mdash; Database,
                authentication and file storage for the portal.
              </li>
              <li>
                <strong className="text-slate-200">Stripe</strong> &mdash; Payment processing and
                invoicing for subscriptions. Card details are handled by Stripe and are not stored
                by us.
              </li>
              <li>
                <strong className="text-slate-200">Cloudflare Turnstile</strong> &mdash; Bot
                protection on public forms.
              </li>
              <li>
                <strong className="text-slate-200">Sentry</strong> &mdash; Error monitoring used to
                keep the portal reliable. Error reports are scrubbed of direct identifiers (names,
                email addresses, phone numbers, credentials, cookies and IP addresses) before they
                leave our servers, and are retained according to our Sentry organization&apos;s
                retention setting.
              </li>
              <li>
                <strong className="text-slate-200">Email delivery provider</strong> &mdash;
                Transactional email such as invitations, notifications and password resets.
              </li>
              <li>
                <strong className="text-slate-200">Microsoft 365 (Graph)</strong> &mdash; Calendar
                synchronization for scheduling and service reminders.
              </li>
              <li>
                <strong className="text-slate-200">DigitalOcean</strong> &mdash; Cloud
                infrastructure hosting our servers.
              </li>
            </ul>
            <p className="cyber-text mt-4 leading-relaxed">
              A current subprocessor list &mdash; including purpose, data categories and processing
              region &mdash; is available on request at{" "}
              <a
                href="mailto:contact@mainecybertech.com"
                className="text-emerald-400 transition hover:text-emerald-300"
              >
                contact@mainecybertech.com
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="cybergreen font-display text-xl font-bold uppercase tracking-wider">
              Cookies, Analytics &amp; Your Choices
            </h2>
            <p className="cyber-text mt-3 leading-relaxed">
              Non-essential third-party scripts are loaded only after you accept them in the
              consent banner. Until then, no analytics or live-chat script is loaded and no IP
              address or location is sent to third parties. We also send Google&apos;s Consent Mode
              v2 signals: all storage is denied by default, analytics storage is granted only after
              you accept, and withdrawing your choice sends a denied update immediately. Your
              choice is stored in your browser and recorded in our systems together with the
              version of this policy and a timestamp. You can change or withdraw your choice at
              any time using the &ldquo;Cookie settings&rdquo; link in the footer; the change takes
              effect immediately for scripts that have not yet loaded and on your next page load
              for scripts already loaded.
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="cyber-text w-full min-w-[640px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-slate-300">
                    <th className="py-2 pr-4 font-semibold">Name</th>
                    <th className="py-2 pr-4 font-semibold">Provider</th>
                    <th className="py-2 pr-4 font-semibold">Purpose</th>
                    <th className="py-2 font-semibold">Set / duration</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-white/5">
                    <td className="py-2 pr-4 font-mono text-xs">mct-consent-v1</td>
                    <td className="py-2 pr-4">Maine CyberTech (local storage)</td>
                    <td className="py-2 pr-4">Remembers your analytics/chat consent choice</td>
                    <td className="py-2">When you choose; kept until you clear site data</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-2 pr-4 font-mono text-xs">_ga, _ga_*</td>
                    <td className="py-2 pr-4">Google Analytics</td>
                    <td className="py-2 pr-4">Distinguishes visitors and measures site usage</td>
                    <td className="py-2">Only after you accept; up to 24 months</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 font-mono text-xs">Tawk.to cookies</td>
                    <td className="py-2 pr-4">Tawk.to</td>
                    <td className="py-2 pr-4">Live-chat session and continuity</td>
                    <td className="py-2">Only after you accept; session to 12 months</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="cyber-text mt-4 leading-relaxed">
              We also maintain two first-party tracking stores on our own servers, both covered by
              the 90-day retention described below:
            </p>
            <ul className="cyber-text mt-2 list-disc space-y-2 pl-6">
              <li>
                <strong className="text-slate-200">Visitor sessions</strong> &mdash; the{" "}
                <code className="font-mono text-xs">public_interactions</code> record created for
                our contact and intake forms. It stores the referring page and browser platform
                for every visitor; your IP address, approximate location and browser details are
                added only after you accept analytics, together with the timestamp and version of
                the policy you accepted.
              </li>
              <li>
                <strong className="text-slate-200">Storefront analytics</strong> &mdash; anonymous{" "}
                <code className="font-mono text-xs">store_analytics_events</code> rows (page,
                product/category identifiers and a random visitor id) that never contain your IP
                address, user-agent or any form content.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="cybergreen font-display text-xl font-bold uppercase tracking-wider">
              Data Retention
            </h2>
            <p className="cyber-text mt-3 leading-relaxed">
              We retain your personal information only as long as necessary to fulfill the purposes
              described in this policy, or as required by law. Contact form submissions and visitor
              session records are purged from our systems after 90 days. Copies forwarded to
              Microsoft Teams and Atlassian JSM for lead tracking are retained under those
              providers&apos; retention settings and may persist longer. First-party store analytics
              events contain no personal information and are also purged after 90 days. Google
              Analytics data is retained in accordance with our Google Analytics property&apos;s
              data-retention setting, and error telemetry sent to Sentry is retained according to
              our Sentry organization&apos;s retention setting.
            </p>
          </section>

          <section>
            <h2 className="cybergreen font-display text-xl font-bold uppercase tracking-wider">
              Your Rights (GDPR / CCPA)
            </h2>
            <p className="cyber-text mt-3 leading-relaxed">
              Depending on your jurisdiction, you may have the right to access, correct, delete, or
              port your personal data, as well as the right to restrict or object to certain
              processing activities. California residents have the right to know what personal
              information is collected and to request deletion under the CCPA.
            </p>
            <p className="cyber-text mt-3 leading-relaxed">
              To exercise your rights, please contact us using the information below. We will
              respond to your request within 30 days.
            </p>
          </section>

          <section>
            <h2 className="cybergreen font-display text-xl font-bold uppercase tracking-wider">
              Contact Information
            </h2>
            <p className="cyber-text mt-3 leading-relaxed">
              If you have any questions about this Privacy Policy or wish to exercise your data
              rights, please contact us at:
            </p>
            <div className="cyber-text mt-4 space-y-1">
              <p>Maine CyberTech</p>
              <p>Limington, ME</p>
              <p>
                Email:{" "}
                <a
                  href="mailto:contact@mainecybertech.com"
                  className="text-emerald-400 transition hover:text-emerald-300"
                >
                  contact@mainecybertech.com
                </a>
              </p>
              <p>
                Phone:{" "}
                <a
                  href="tel:+12072227525"
                  className="text-emerald-400 transition hover:text-emerald-300"
                >
                  (207) 222-7525
                </a>
              </p>
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
