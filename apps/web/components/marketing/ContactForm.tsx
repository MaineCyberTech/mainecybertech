"use client";

import { useState, useEffect } from "react";
import { submitLead } from "../../app/(public)/contact/actions";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface FormData {
  company: string;
  name: string;
  email: string;
  phone: string;
  services: string;
  employees: string;
  urgency: string;
  message: string;
}

const initialForm: FormData = {
  company: "", name: "", email: "", phone: "",
  services: "", employees: "", urgency: "", message: "",
};

export default function ContactForm() {
  const [trackingId, setTrackingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [form, setForm] = useState<FormData>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  useEffect(() => {
    fetch(`${API_BASE}/api/v1/public/init`)
      .then((r) => r.json())
      .then((d) => { setTrackingId(d.data.trackingId); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  function validate(): boolean {
    const errs: Partial<Record<keyof FormData, string>> = {};
    if (!form.company.trim()) errs.company = "Required";
    if (!form.name.trim()) errs.name = "Required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Valid email required";
    if (!form.phone.trim()) errs.phone = "Required";
    if (!form.services) errs.services = "Select a service";
    if (!form.employees) errs.employees = "Select size";
    if (!form.urgency) errs.urgency = "Select urgency";
    if (!form.message.trim()) errs.message = "Required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate() || !trackingId) return;

    setSubmitting(true);
    setStatus(null);

    try {
      const res = await submitLead({ ...form, trackingId });
      if (res.success) {
        setStatus({ type: "success", message: "Thank you. A ticket has been created and our team will be in touch shortly." });
        setForm(initialForm);
      } else {
        setStatus({ type: "error", message: res.error || "Submission failed. Please try again." });
      }
    } catch {
      setStatus({ type: "error", message: "There was a communication error. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  function update(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  const inputCls = (field: keyof FormData) =>
    `w-full rounded border border-white/10 bg-[#0A1118]/60 px-4 py-3 text-sm text-slate-50 outline-none transition focus:border-emerald-600 focus:bg-[#0A1118]/90 focus:shadow-[0_0_10px_rgba(5,150,105,0.2)] ${errors[field] ? "border-red-500" : ""}`;

  const labelCls = "mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-300";

  return (
    <form onSubmit={handleSubmit} className="intake-widget space-y-5">
      <div>
        <label className={labelCls}>Company Name</label>
        <input type="text" value={form.company} onChange={(e) => update("company", e.target.value)} className={inputCls("company")} />
        {errors.company && <p className="mt-1 text-xs text-red-400">{errors.company}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className={labelCls}>Contact Name</label>
          <input type="text" value={form.name} onChange={(e) => update("name", e.target.value)} className={inputCls("name")} />
          {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
        </div>
        <div>
          <label className={labelCls}>Work Email</label>
          <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} className={inputCls("email")} />
          {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
        </div>
        <div>
          <label className={labelCls}>Phone Number</label>
          <input type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} className={inputCls("phone")} />
          {errors.phone && <p className="mt-1 text-xs text-red-400">{errors.phone}</p>}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className={labelCls}>Services of Interest</label>
          <select value={form.services} onChange={(e) => update("services", e.target.value)} className={inputCls("services")}>
            <option value="" disabled>Select primary service...</option>
            <option value="Managed IT Support">Managed IT Support</option>
            <option value="Cybersecurity & Compliance">Cybersecurity & Compliance</option>
            <option value="Cloud Migration & Hosting">Cloud Migration & Hosting</option>
            <option value="Network Infrastructure">Network Infrastructure</option>
            <option value="Backup & Disaster Recovery">Backup & Disaster Recovery</option>
            <option value="IT Consulting / Virtual CIO">IT Consulting / Virtual CIO</option>
            <option value="Other / Unsure">Other / Unsure</option>
          </select>
          {errors.services && <p className="mt-1 text-xs text-red-400">{errors.services}</p>}
        </div>
        <div>
          <label className={labelCls}>Employees</label>
          <select value={form.employees} onChange={(e) => update("employees", e.target.value)} className={inputCls("employees")}>
            <option value="" disabled>Select size...</option>
            <option value="1-10">1 - 10</option>
            <option value="11-50">11 - 50</option>
            <option value="51-200">51 - 200</option>
            <option value="200+">200+</option>
          </select>
          {errors.employees && <p className="mt-1 text-xs text-red-400">{errors.employees}</p>}
        </div>
        <div>
          <label className={labelCls}>Urgency</label>
          <select value={form.urgency} onChange={(e) => update("urgency", e.target.value)} className={inputCls("urgency")}>
            <option value="" disabled>Select urgency...</option>
            <option value="Low - Just Exploring">Low - Just Exploring options</option>
            <option value="Medium - Planning Phase">Medium - Planning an upcoming project</option>
            <option value="High - Active Issue">High - Need immediate assistance</option>
          </select>
          {errors.urgency && <p className="mt-1 text-xs text-red-400">{errors.urgency}</p>}
        </div>
      </div>

      <div>
        <label className={labelCls}>How can we assist your business?</label>
        <textarea rows={4} value={form.message} onChange={(e) => update("message", e.target.value)} placeholder="Briefly describe your current IT setup or the challenge you are facing..." className={inputCls("message")} />
        {errors.message && <p className="mt-1 text-xs text-red-400">{errors.message}</p>}
      </div>

      <button
        type="submit"
        disabled={loading || submitting}
        className="w-full rounded border-2 border-emerald-600 bg-emerald-600 px-6 py-4 font-orbitron text-sm font-bold uppercase tracking-widest text-[#0A1118] transition hover:bg-transparent hover:text-emerald-500 hover:shadow-[0_0_25px_rgba(5,150,105,0.5)] disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-slate-500 disabled:shadow-none"
      >
        {loading ? "Establishing Secure Connection..." : submitting ? "Processing Request..." : "Submit Service Request"}
      </button>

      {status && (
        <div
          className={`rounded border p-4 text-sm font-medium ${
            status.type === "success"
              ? "border-emerald-600/30 bg-emerald-600/10 text-emerald-500"
              : "border-red-500/30 bg-red-500/10 text-red-400"
          }`}
        >
          {status.message}
        </div>
      )}
    </form>
  );
}
