import type { ReactNode } from "react";
import StoreSidebar from "@/components/store/StoreSidebar";

export default function StoreLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col lg:flex-row lg:gap-8">
      <div className="lg:hidden">
        <StoreSidebar />
      </div>
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="sticky top-28">
          <StoreSidebar />
        </div>
      </aside>
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
