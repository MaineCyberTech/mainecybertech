import type { Metadata } from "next";
import Breadcrumbs from "../../../components/Breadcrumbs";

export const metadata: Metadata = {
  title: "Terms of Service",
};

export const dynamic = "force-dynamic";

export default function TermsPage() {
  return (
    <section className="min-h-screen px-4 pb-20 pt-32 sm:px-6 sm:pt-40">
      <div className="mx-auto max-w-4xl">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Terms of Service" }]} />

        <h1 className="font-orbitron text-4xl font-bold uppercase tracking-wider text-slate-50 sm:text-5xl">
          Terms of <span className="text-emerald-500">Service</span>
        </h1>
        <p className="mt-4 text-sm text-slate-500">Last updated: July 1, 2026</p>

        <div className="cyber-panel mt-10 space-y-8">
          <section>
            <h2 className="cybergreen font-orbitron text-xl font-bold uppercase tracking-wider">
              Service Description
            </h2>
            <p className="cyber-text mt-3 leading-relaxed">
              Maine CyberTech provides managed IT support, cybersecurity services, network
              infrastructure, cloud migration, backup and disaster recovery, and technology
              consulting to businesses and organizations. The specific scope of services,
              deliverables, timelines, and fees will be defined in a separate Service Agreement or
              Statement of Work executed between Maine CyberTech and the client.
            </p>
          </section>

          <section>
            <h2 className="cybergreen font-orbitron text-xl font-bold uppercase tracking-wider">
              User Obligations
            </h2>
            <p className="cyber-text mt-3 leading-relaxed">
              By using our website and submitting a service request, you agree to provide accurate,
              current, and complete information. You agree not to use our website for any unlawful
              purpose or in violation of any applicable laws or regulations. You are responsible for
              maintaining the confidentiality of any account credentials and for all activities that
              occur under your account.
            </p>
          </section>

          <section>
            <h2 className="cybergreen font-orbitron text-xl font-bold uppercase tracking-wider">
              Intellectual Property
            </h2>
            <p className="cyber-text mt-3 leading-relaxed">
              All content on this website, including text, graphics, logos, icons, images, audio
              clips, and software, is the property of Maine CyberTech or its content suppliers and
              is protected by applicable intellectual property laws. You may not reproduce,
              distribute, modify, or create derivative works without our prior written consent.
            </p>
          </section>

          <section>
            <h2 className="cybergreen font-orbitron text-xl font-bold uppercase tracking-wider">
              Limitation of Liability
            </h2>
            <p className="cyber-text mt-3 leading-relaxed">
              To the maximum extent permitted by law, Maine CyberTech shall not be liable for any
              indirect, incidental, special, consequential, or punitive damages arising out of or
              related to your use of our website or services. Our total liability for any claim
              arising under these terms shall not exceed the amount you have paid us for the
              specific service giving rise to the claim.
            </p>
          </section>

          <section>
            <h2 className="cybergreen font-orbitron text-xl font-bold uppercase tracking-wider">
              Termination
            </h2>
            <p className="cyber-text mt-3 leading-relaxed">
              We reserve the right to suspend or terminate your access to our website or services at
              any time, without notice, if you violate these terms or engage in conduct that we deem
              harmful to our business or other users. Upon termination, your right to use our
              services will immediately cease.
            </p>
          </section>

          <section>
            <h2 className="cybergreen font-orbitron text-xl font-bold uppercase tracking-wider">
              Governing Law
            </h2>
            <p className="cyber-text mt-3 leading-relaxed">
              These Terms of Service shall be governed by and construed in accordance with the laws
              of the State of Maine, without regard to its conflict of law provisions. Any disputes
              arising under these terms shall be resolved in the courts of York County, Maine.
            </p>
          </section>
        </div>
      </div>
    </section>
  );
}
