import StoreAuditClient from "./StoreAuditClient";
import { requireAdminAccess } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Store Audit - Admin - Maine CyberTech" };

export default async function StoreAuditPage() {
  await requireAdminAccess();
  return <StoreAuditClient />;
}
