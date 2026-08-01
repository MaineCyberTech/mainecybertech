"use client";

import type { ReactNode } from "react";
import SidebarShell from "@/components/layout/SidebarShell";
import PortalSidebarContent from "./PortalSidebarContent";

export default function PortalSidebarLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarShell
      navLabel="Open portal navigation"
      brandLabel="Portal"
      content={<PortalSidebarContent mobile />}
    >
      {children}
    </SidebarShell>
  );
}
