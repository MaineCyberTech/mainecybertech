"use client";

import type { ReactNode } from "react";
import SidebarShell from "@/components/layout/SidebarShell";
import AdminSidebarContent from "./AdminSidebarContent";

export default function AdminSidebarLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarShell
      navLabel="Open admin navigation"
      brandLabel="Admin"
      content={<AdminSidebarContent mobile />}
    >
      {children}
    </SidebarShell>
  );
}
