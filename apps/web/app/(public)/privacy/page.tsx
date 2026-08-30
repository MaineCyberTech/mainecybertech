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

        <h1 className="font-orbitron text-4xl font-bold uppercase tracking-wider text-slate-50 sm:text-5xl">
          Privacy <span className="text-emerald-500">Policy</span>
        </h1>
        <p className="mt-4 text-sm text-slate-500">Last updated: July 1, 2026</p>

        <div className="cyber-panel mt-10 space-y-8">
          <section>
            <h2 className="cybergreen font-orbitron text-xl font-bold uppercase tracking-wider">
              Information We Collect
            </h2>
            <p className="cyber-text mt-3 leading-relaxed">
              When you fill out our contact form, we collect your name, email address, phone number,
              company name, and any message you provide. We also automatically collect technical
              information such as your IP address, browser type, operating system, referring page,
              and the pages you visit on our site.
            </p>
          </section>

          <section>
            <h2 className="cybergreen font-orbitron text-xl font-bold uppercase tracking-wider">
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
            <h2 className="cybergreen font-orbitron text-xl font-bold uppercase tracking-wider">
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
                perform IP geolocation lookups on visitors for analytics and fraud prevention
                purposes. No data is permanently stored by ip-api.com.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="cybergreen font-orbitron text-xl font-bold uppercase tracking-wider">
              Data Retention
            </h2>
            <p className="cyber-text mt-3 leading-relaxed">
              We retain your personal information only as long as necessary to fulfill the purposes
              described in this policy, or as required by law. Contact form submissions are retained
              for up to three years. Analytics data is retained in accordance with Google
              Analytics&apos; data retention settings.
            </p>
          </section>

          <section>
            <h2 className="cybergreen font-orbitron text-xl font-bold uppercase tracking-wider">
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
            <h2 className="cybergreen font-orbitron text-xl font-bold uppercase tracking-wider">
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
