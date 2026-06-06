import Link from "next/link";
import { requireAdminAccess } from "@/lib/auth/admin";

export default async function PortalAdminQuickSwitch() {
  let canAccessAdmin = false;
  try {
    await requireAdminAccess();
    canAccessAdmin = true;
  } catch {
    canAccessAdmin = false;
  }

  if (!canAccessAdmin) return null;

  return (
    <Link href="/admin" className="cyber-button-secondary">
      Open Admin
    </Link>
  );
}
