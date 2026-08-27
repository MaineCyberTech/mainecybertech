/**
 * Runtime Express route extraction for OpenAPI generation (P2-8).
 *
 * Instead of hand-maintaining every endpoint in spec.ts (which drifted out of
 * sync with the 55+ route files), we reconstruct the route tree directly from
 * the live Express router stack. Each layer is either a route (has `.route`)
 * or a mounted sub-router (has `.handle.stack`/`router`). We walk recursively,
 * tracking the accumulated path prefix, and emit `{ method, path }` entries in
 * OpenAPI form.
 *
 * Express encodes paths in regexp + a relative route path; we reconstruct the
 * human-readable path by combining the mount prefix (derived from the layer's
 * regexp static segments) with the route's own path.
 */
import type { Express, Router } from "express";

const PARAM_RE = /:([A-Za-z0-9_]+)/g;

function staticPrefixFromRegexp(regexp: RegExp): string {
  // Express mount regexps look like: /^\/api\/v1\/tickets\/?(?=\/|$)/i
  // Extract the leading static path up to the first capture group or optional.
  const src = regexp.source;
  const match = src.match(/^\^(\/[^\/()\\?*+|^]+)/);
  if (!match) return "";
  return match[1].replace(/\\\//g, "/");
}

interface RawRoute {
  method: string;
  path: string;
}

function walk(stack: Array<{ regexp?: RegExp; route?: { path?: string; methods?: Record<string, boolean> }; handle?: { stack?: unknown[]; name?: string } }>, prefix: string, out: RawRoute[]) {
  if (!stack) return;
  for (const layer of stack) {
    if (layer.route && layer.route.path) {
      const methods = Object.keys(layer.route.methods ?? {}).filter(
        (m) => m !== "_all" && m !== "head" && m !== "options",
      );
      for (const method of methods) {
        out.push({ method: method.toUpperCase(), path: (prefix + layer.route.path).replace(/\/+/g, "/") });
      }
    } else if (layer.handle && Array.isArray((layer.handle as { stack?: unknown[] }).stack)) {
      const subStack = (layer.handle as { stack: Array<{ regexp?: RegExp }> }).stack;
      const subPrefix = staticPrefixFromRegexp(layer.regexp ?? /^\/$/) || prefix;
      // Express sub-router layers have a regexp for the mount; combine with prefix.
      walk(subStack as never, subPrefix, out);
    }
  }
}

export function extractRoutes(app: Express | Router): RawRoute[] {
  const out: RawRoute[] = [];
  const router = (app as unknown as { _router?: { stack: Array<{ regexp?: RegExp; route?: unknown; handle?: { stack?: unknown[] } }> } })._router;
  if (!router || !router.stack) return out;
  walk(router.stack as never, "", out);
  // Normalize :param already handled; dedupe
  const seen = new Set<string>();
  const deduped: RawRoute[] = [];
  for (const r of out) {
    const key = `${r.method} ${r.path}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(r);
    }
  }
  return deduped.sort((a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method));
}
