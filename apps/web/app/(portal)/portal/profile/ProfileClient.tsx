"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getClientApi } from "@/lib/client-api";

type Props = {
  initialData: {
    userId: string;
    email: string;
    fullName: string | null;
    phone: string | null;
    title: string | null;
  } | null;
};

export default function ProfilePage({ initialData }: Props) {
  const [fullName, setFullName] = useState(initialData?.fullName ?? "");
  const [phone, setPhone] = useState(initialData?.phone ?? "");
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [email, setEmail] = useState(initialData?.email ?? "");
  const [userId, setUserId] = useState<string | null>(initialData?.userId ?? null);
  const [loading, setLoading] = useState(!initialData);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [pwCurrent, setPwCurrent] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [savingPw, setSavingPw] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (initialData) return;
    async function load() {
      try {
        const user = await getClientApi().users.me();
        setUserId(user.userId);
        setEmail(user.email ?? "");
        setFullName(user.fullName ?? "");
        setPhone(user.phone ?? "");
        setTitle(user.title ?? "");
        setAvatarUrl(user.avatarUrl ?? null);
      } catch {
        router.push("/login");
      }
      setLoading(false);
    }
    load();
  }, [router, initialData]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      await getClientApi().profiles.update(userId!, {
        fullName: fullName || null,
        phone: phone || null,
        title: title || null,
      });
      setMessage("Profile updated successfully.");
    } catch (err: any) {
      setError(err?.message ?? "An unexpected error occurred.");
    }
    setSaving(false);
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    if (pwNew !== pwConfirm) { setError("Passwords do not match."); return; }
    if (pwNew.length < 6) { setError("Password must be at least 6 characters."); return; }
    setSavingPw(true);
    setMessage("");
    setError("");

    try {
      await getClientApi().auth.resetPassword(email, pwNew);
      setMessage("Password changed successfully.");
      setPwCurrent("");
      setPwNew("");
      setPwConfirm("");
    } catch (err: any) {
      setError(err?.message ?? "An unexpected error occurred.");
    }
    setSavingPw(false);
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    setMessage("");
    setError("");

    try {
      const result = await getClientApi().profiles.uploadAvatar(userId!, file);
      setAvatarUrl(result.avatarUrl);
      setMessage("Avatar updated successfully.");
    } catch (err: any) {
      setError(err?.message ?? "An unexpected error occurred.");
    }
    setUploadingAvatar(false);
  }

  if (loading) return <div className="py-8 text-center text-sm text-slate-500">Loading profile...</div>;
  if (!userId) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-orbitron text-2xl uppercase tracking-[0.14em] text-slate-50">Profile</h1>
        <p className="mt-3 text-slate-400">Update your name, phone number, and job title.</p>
      </div>

      {message ? (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">{message}</div>
      ) : null}
      {error ? (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">{error}</div>
      ) : null}

      <form onSubmit={handleSave} className="space-y-6">
        <div>
          <label className="cyber-label">Email</label>
          <input value={email} disabled className="w-full rounded-lg border border-white/10 bg-[#0A1118]/40 px-4 py-3 text-slate-400 outline-none" />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="cyber-label">Full Name</label>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="cyber-input" />
          </div>
          <div>
            <label className="cyber-label">Phone</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="cyber-input" />
          </div>
        </div>

        <div>
          <label className="cyber-label">Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="cyber-input" />
        </div>

        <button type="submit" disabled={saving} className="cyber-button">
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </form>

      <hr className="border-white/10" />

      <div>
        <h2 className="font-orbitron text-lg uppercase tracking-[0.14em] text-slate-50">Avatar</h2>
        <p className="mt-2 text-slate-400">Upload a profile photo (JPEG, PNG, WebP, or GIF, max 2MB).</p>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-emerald-600/20 text-3xl font-bold text-emerald-400">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
          ) : (
            (fullName ?? email)[0].toUpperCase()
          )}
        </div>
        <div>
          <label className="relative cursor-pointer rounded-lg border-2 border-emerald-600 bg-transparent px-4 py-2.5 font-orbitron text-xs font-bold uppercase tracking-[0.18em] text-emerald-500 transition-all hover:bg-emerald-600/10">
            {uploadingAvatar ? "Uploading..." : "Choose File"}
            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleAvatarUpload} className="absolute inset-0 opacity-0" disabled={uploadingAvatar} />
          </label>
        </div>
      </div>

      <hr className="border-white/10" />

      <hr className="border-white/10" />

      <div>
        <h2 className="font-orbitron text-lg uppercase tracking-[0.14em] text-slate-50">Change Password</h2>
        <p className="mt-2 text-slate-400">Update your account password.</p>
      </div>

      <form onSubmit={handlePasswordChange} className="space-y-6">
        <div>
          <label className="cyber-label">Current Password</label>
          <input type="password" value={pwCurrent} onChange={(e) => setPwCurrent(e.target.value)} required className="cyber-input" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="cyber-label">New Password</label>
            <input type="password" value={pwNew} onChange={(e) => setPwNew(e.target.value)} required minLength={6} className="cyber-input" />
          </div>
          <div>
            <label className="cyber-label">Confirm New Password</label>
            <input type="password" value={pwConfirm} onChange={(e) => setPwConfirm(e.target.value)} required className="cyber-input" />
          </div>
        </div>

        <button type="submit" disabled={savingPw} className="cyber-button">
          {savingPw ? "Changing..." : "Change Password"}
        </button>
      </form>
    </div>
  );
}
