import type { ReactNode } from "react";
import { getApiClient } from "@/lib/api";
import { redirect } from "next/navigation";
import AdminHeaderActions from "@/components/admin/AdminHeaderActions";
import AdminGlobalSearch from "@/components/admin/AdminGlobalSearch";
import NotificationBell from "@/components/NotificationBell";
import { getUnreadCount } from "@/lib/notifications-actions";
import AdminSidebar from "@/components/admin/AdminSidebarContent";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children
}: {
  children: ReactNode;
}) {
  let user;
  try {
    user = await getApiClient().users.me();
  } catch {
    user = null;
  }

  if (!user?.userId) {
    redirect("/login");
  }

  let unreadCount = 0;
  try {
    unreadCount = await getUnreadCount();
  } catch {
    unreadCount = 0;
  }

  return (
    <div className="min-h-screen bg-[#0A1118] text-slate-50">
      <header className="sticky top-0 z-40 border-b border-emerald-600/20 bg-[#0A1118]/85 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-start justify-between gap-3 sm:gap-4">
            <div className="cyber-header-title">
              Maine <span className="text-emerald-600">CyberTech</span>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <div className="hidden sm:block"><AdminGlobalSearch /></div>
              <NotificationBell basePath="/admin" initialUnread={unreadCount} />
              <AdminHeaderActions />
            </div>
          </div>

          <div className="mt-2 sm:hidden"><AdminGlobalSearch /></div>

          <p className="mt-1 text-xs text-slate-400 sm:text-sm">
            Admin operations workspace
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col lg:flex-row lg:gap-8">
          <aside className="hidden w-56 shrink-0 py-6 lg:block">
            <div className="sticky top-28">
              <AdminSidebar />
            </div>
          </aside>
          <main className="min-w-0 flex-1 py-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
