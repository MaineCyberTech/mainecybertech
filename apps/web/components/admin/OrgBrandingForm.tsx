"use client";

import { useState, useRef } from "react";
import { getClientApi } from "@/lib/client-api";

type Props = {
  organizationId: string;
  initialLogoUrl?: string | null;
  initialBrandColor?: string | null;
  initialAccentColor?: string | null;
  initialCustomDomain?: string | null;
};

export default function OrgBrandingForm({
  organizationId,
  initialLogoUrl,
  initialBrandColor,
  initialAccentColor,
  initialCustomDomain,
}: Props) {
  const [logoUrl, setLogoUrl] = useState(initialLogoUrl ?? "");
  const [brandColor, setBrandColor] = useState(initialBrandColor ?? "#059669");
  const [accentColor, setAccentColor] = useState(initialAccentColor ?? "#0D9488");
  const [customDomain, setCustomDomain] = useState(initialCustomDomain ?? "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [imgError, setImgError] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleSave() {
    setSaving(true);
    try {
      await getClientApi().organizations.update(organizationId, {
        logoUrl: logoUrl || null,
        brandColor: brandColor || null,
        accentColor: accentColor || null,
        customDomain: customDomain || null,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {}
    setSaving(false);
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError("");
    try {
      const result = await getClientApi().organizations.uploadLogo(organizationId, file);
      setLogoUrl(result.logoUrl);
    } catch (err: any) {
      setUploadError(err?.message ?? "Network error uploading logo");
    }
    setUploading(false);
  }

  return (
    <section className="cyber-panel">
      <h2 className="cyber-heading text-lg">Branding</h2>

      {saved ? (
        <div className="mt-4 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">Branding saved.</div>
      ) : null}
      {uploadError ? (
        <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">{uploadError}</div>
      ) : null}

      <div className="mt-6 space-y-6">
        <div>
          <label className="cyber-label">Organization Logo</label>
          <div className="mt-2 flex items-center gap-4">
            {logoUrl && !imgError ? (
              <img src={logoUrl} alt="Logo" className="h-16 w-16 rounded-lg border border-white/10 object-contain bg-[#071018]" onError={() => setImgError(true)} />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-white/10 text-2xl text-slate-600">{logoUrl ? "!" : "+"}</div>
            )}
            <div>
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/svg+xml" onChange={handleLogoUpload} className="hidden" />
              <button onClick={() => fileRef.current?.click()} disabled={uploading} className="cyber-button-secondary text-xs">
                {uploading ? "Uploading..." : "Upload Logo"}
              </button>
              <p className="mt-1 text-xs text-slate-600">PNG, JPG, or SVG. 5MB max.</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="cyber-label">Brand Color</label>
            <div className="mt-2 flex items-center gap-3">
              <input type="color" value={brandColor} onChange={(e) => setBrandColor(e.target.value)} className="h-10 w-10 rounded border border-white/10 bg-transparent cursor-pointer" />
              <input type="text" value={brandColor} onChange={(e) => setBrandColor(e.target.value)} className="cyber-input font-mono text-xs" placeholder="#059669" />
            </div>
          </div>

          <div>
            <label className="cyber-label">Accent Color</label>
            <div className="mt-2 flex items-center gap-3">
              <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="h-10 w-10 rounded border border-white/10 bg-transparent cursor-pointer" />
              <input type="text" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="cyber-input font-mono text-xs" placeholder="#0D9488" />
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="cyber-label">Custom Domain</label>
            <input type="text" value={customDomain} onChange={(e) => setCustomDomain(e.target.value)} className="cyber-input" placeholder="portal.myclient.com" />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="h-8 w-16 rounded" style={{ backgroundColor: brandColor || "#059669" }} />
          <div className="h-8 w-16 rounded" style={{ backgroundColor: accentColor || "#0D9488" }} />
          <span className="text-xs text-slate-500">Preview</span>
        </div>

        <button onClick={handleSave} disabled={saving} className="cyber-button">
          {saving ? "Saving..." : "Save Branding"}
        </button>
      </div>
    </section>
  );
}
