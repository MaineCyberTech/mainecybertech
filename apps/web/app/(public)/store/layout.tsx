import type { ReactNode } from "react";
import StoreSidebar from "@/components/store/StoreSidebar";

export default function StoreLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-8">
      <StoreSidebar />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
