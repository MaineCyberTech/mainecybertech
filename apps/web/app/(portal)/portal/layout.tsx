import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

export default function PortalSectionLayout({
  children
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
