import StoreLayoutShell from "@/components/store/StoreLayoutShell";
import { loadCatalog } from "@/lib/catalog/catalog-source";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

export default async function StoreLayout({ children }: { children: ReactNode }) {
  const { categories } = await loadCatalog();

  return <StoreLayoutShell categories={categories}>{children}</StoreLayoutShell>;
}
