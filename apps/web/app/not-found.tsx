import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0A1118]">
      <div className="max-w-md text-center">
        <h1 className="text-6xl font-bold text-emerald-500">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-slate-100">Page not found</h2>
        <p className="mt-2 text-sm text-slate-400">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link href="/" className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-500">
            Go home
          </Link>
          <Link href="/contact" className="rounded-lg border border-slate-700 px-5 py-2.5 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:text-white">
            Contact support
          </Link>
        </div>
      </div>
    </div>
  );
}
