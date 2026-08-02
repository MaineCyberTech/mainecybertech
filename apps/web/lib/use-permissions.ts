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

export function usePermissions() {
  const [data, setData] = useState<MyPermissionsResponse | null>(() => (cache ? cache.data : null));
  const [loading, setLoading] = useState(!cache);
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
    (moduleKey: string, actionKey = "view") => canCheck(effective, moduleKey, actionKey),
    [effective],
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
