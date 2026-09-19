import { requireAdminAccess } from "@/lib/auth/admin";
import ImportExportClient from "./ImportExportClient";
export const dynamic = "force-dynamic";
export const metadata = { title: "Store Import/Export - Admin" };

export default async function StoreImportExportPage() {
  await requireAdminAccess();
  return <ImportExportClient />;
}
