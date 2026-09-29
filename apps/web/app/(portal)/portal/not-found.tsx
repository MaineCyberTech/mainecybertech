import Link from "next/link";

export default function PortalNotFound() {
  return (
    <div className="cyber-panel mx-auto mt-10 max-w-lg text-center">
      <h1 className="cyber-heading text-2xl">Not Found</h1>
      <p className="mt-3 text-sm text-slate-400">
        The requested record does not exist or was deleted.
      </p>
      <Link href="/portal/dashboard" className="cyber-button mt-6 inline-block">
        Back to Dashboard
      </Link>
    </div>
  );
}
