"use client";

import type { ReactNode } from "react";
import { usePermissions } from "@/lib/use-permissions";

type Props = {
  module: string;
  action?: string;
  children: ReactNode;
  fallback?: ReactNode;
};

/**
 * Renders children only when the current user holds
 * `module:action`. Useful for gating buttons and action menus.
 */
export default function HasPermission({
  module,
  action = "view",
  children,
  fallback = null,
}: Props) {
  const { can } = usePermissions();
  return <>{can(module, action) ? children : fallback}</>;
}
