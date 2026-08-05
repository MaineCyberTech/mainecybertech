import { getClientEnv } from "@/lib/env";
import UploadForm from "./UploadForm";

export type FileRequestInfo = {
  id: string;
  title: string;
  description: string | null;
  maxFileSizeMb: number | null;
  allowedMimeTypes: string[] | null;
  maxFiles: number;
  uploadCount: number;
  expiresAt: string;
};

export default async function PublicUploadPage(props: { params: Promise<{ token: string }> }) {
  const { token } = await props.params;
  const apiUrl = getClientEnv().NEXT_PUBLIC_API_URL;

  let info: FileRequestInfo | null = null;
  let error: string | null = null;
  try {
    const res = await fetch(`${apiUrl}/api/v1/file-requests/public/${token}`, {
      cache: "no-store",
    });
    if (res.ok) {
      const body = await res.json();
      info = body.data;
    } else {
      const body = await res.json().catch(() => null);
      error = body?.error?.message ?? `Upload link is unavailable (${res.status}).`;
    }
  } catch {
    error = "Could not reach the upload service.";
  }

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-xl flex-col items-center justify-center px-6 py-16">
      <div className="w-full rounded-2xl border border-white/10 bg-[#0A1118]/80 p-8 shadow-2xl">
        <h1 className="mb-1 text-2xl font-bold text-slate-50">
          {info ? info.title : "Secure File Upload"}
        </h1>
        {info?.description && <p className="mb-4 text-sm text-slate-400">{info.description}</p>}

        {error ? (
          <p className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </p>
        ) : info ? (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-widest text-slate-400">
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5">
                {info.uploadCount}/{info.maxFiles} files uploaded
              </span>
              {info.maxFileSizeMb && (
                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5">
                  Max {info.maxFileSizeMb}MB
                </span>
              )}
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5">
                Expires {new Date(info.expiresAt).toLocaleDateString()}
              </span>
            </div>

            {info.uploadCount >= info.maxFiles ? (
              <p className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-300">
                This upload link has reached its file limit.
              </p>
            ) : (
              <UploadForm token={token} apiUrl={apiUrl} maxFileSizeMb={info.maxFileSizeMb} />
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
