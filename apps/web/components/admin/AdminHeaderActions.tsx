import Link from "next/link";
import { logoutAction } from "@/lib/auth/auth-actions";
import { ThemeToggle } from "@mct/ui/components/ThemeToggle";

const actionClass =
  "rounded-lg border-2 border-emerald-600 bg-transparent px-4 py-2.5 font-orbitron text-xs font-bold uppercase tracking-[0.18em] text-emerald-500 transition-all hover:bg-emerald-600/10";

export default async function AdminHeaderActions() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link href="/portal/dashboard" className={actionClass}>
        Client Portal
      </Link>

      <ThemeToggle />

      <form action={logoutAction}>
        <button type="submit" className={actionClass}>
          Sign Out
        </button>
      </form>
    </div>
  );
}
