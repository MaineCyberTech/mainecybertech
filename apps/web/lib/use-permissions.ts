"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getClientApi } from "@/lib/client-api";
import { can as canCheck, type EffectivePermissions } from "@/lib/permissions";
import type { MyPermissionsResponse } from "@mct/sdk";

let cache: { data: MyPermissionsResponse | null; at: number } | null = null;
const CACHE_TTL = 60_000;
let inflight: Promise<MyPermissionsResponse> | null = null;

async function loadPermissions(): Promise<MyPermissionsResponse> {
  if (cache && Date.now() - cache.at < CACHE_TTL && cache.data) return cache.data;
  if (inflight) return inflight;
  inflight = getClientApi()
    .permissions.getMyPermissions()
    .then((data) => {
      cache = { data, at: Date.now() };
      return data;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

export function invalidatePermissionsCache() {
  cache = null;
}

export type ServerPermissionData = {
  isSuperAdmin: boolean;
  keys: string[];
};

/**
 * Provides the effective permission set for the current user.
 *
 * `serverPermissions` (optional) seeds the hook with data fetched
 * server-side so navigation renders correctly on first paint without
 * an extra client round-trip. On fetch failure the hook degrades to
 * fail-open (`can()` returns true) so the UI never collapses into an
 * empty shell — the API remains the enforcement point.
 */
export function usePermissions(serverPermissions?: ServerPermissionData | null) {
  const [data, setData] = useState<MyPermissionsResponse | null>(() => {
    if (serverPermissions) {
      return {
        isSuperAdmin: serverPermissions.isSuperAdmin,
        keys: serverPermissions.keys,
        permissions: [],
        roles: [],
        memberships: [],
      };
    }
    return cache ? cache.data : null;
  });
  const [loading, setLoading] = useState(() => !serverPermissions && !cache);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    let cancelled = false;
    loadPermissions()
      .then((result) => {
        if (cancelled) return;
        setData(result);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const effective = useMemo<EffectivePermissions>(
    () => ({
      isSuperAdmin: data?.isSuperAdmin ?? false,
      keys: data?.keys ?? [],
      permissions: data?.permissions ?? [],
      roles: data?.roles ?? [],
    }),
    [data],
  );

  const can = useCallback(
    (moduleKey: string, actionKey = "view") => {
      if (error && !data) return true;
      return canCheck(effective, moduleKey, actionKey);
    },
    [effective, error, data],
  );

  const refresh = useCallback(async () => {
    invalidatePermissionsCache();
    const fresh = await loadPermissions();
    setData(fresh);
    setError(null);
    return fresh;
  }, []);

  return { ...effective, loading, error, can, refresh };
}
