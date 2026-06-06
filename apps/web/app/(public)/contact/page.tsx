import type { Metadata } from "next";
import ContactForm from "../../../components/marketing/ContactForm";

export const metadata: Metadata = {
  title: "Contact Us — Maine CyberTech",
  description: "Get in touch with Maine CyberTech for IT support, security, and networking services.",
};

export default function ContactPage() {
  return (
    <section className="min-h-screen px-4 pt-32 pb-20 sm:px-6 sm:pt-40">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 text-center">
          <h1 className="font-orbitron text-4xl font-bold uppercase tracking-wider text-slate-50 sm:text-5xl">
            Contact <span className="text-emerald-500">Us</span>
          </h1>
          <p className="mt-4 text-lg text-slate-400">
            We are ready to secure and support your network.
          </p>
        </div>

        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="font-orbitron text-3xl font-bold uppercase tracking-wider text-slate-50">
              Let&apos;s Connect
            </h2>
            <p className="mt-6 mb-10 text-lg leading-relaxed text-slate-400">
              Reach out today to schedule a consultation or request immediate support. Our engineers are standing by.
            </p>

            <div className="space-y-6">
              <div className="flex items-center gap-4 text-lg">
                <span className="text-2xl text-emerald-500">📍</span>
                <span className="text-slate-300">Limington, ME</span>
              </div>
              <div className="flex items-center gap-4 text-lg">
                <span className="text-2xl text-emerald-500">📞</span>
                <a href="tel:+12072227525" className="text-slate-300 no-underline transition hover:text-emerald-400">(207) 222-7525</a>
              </div>
              <div className="flex items-center gap-4 text-lg">
                <span className="text-2xl text-emerald-500">✉️</span>
                <a href="mailto:contact@mainecybertech.com" className="text-slate-300 no-underline transition hover:text-emerald-400">contact@mainecybertech.com</a>
              </div>
            </div>

            <div className="mt-12 border-t border-white/10 pt-8">
              <p className="text-sm text-slate-500">
                Please fill out the secure form to the right, and a member of our team will assist you shortly.
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-emerald-600/30 bg-[rgba(18,30,45,0.75)] p-6 shadow-[0_0_30px_rgba(5,150,105,0.05)] backdrop-blur-md sm:p-8">
            <ContactForm />
          </div>
        </div>
      </div>
    </section>
  );
}
