import http from "node:http";
import https from "node:https";
import dns from "node:dns";
import { isPrivateIpAddress } from "./ssrf-guard";

export type PinnedResponse = {
  status: number;
  text: () => Promise<string>;
};

export type PinnedFetchInit = {
  method?: string;
  headers?: Record<string, string>;
  /** String for text bodies (webhooks); Buffer for binary bodies (Web Push). */
  body?: string | Buffer;
  signal?: AbortSignal;
};

/**
 * WH-P3-007: cap how many response bytes are buffered from a webhook receiver.
 * A receiver could otherwise stream an unbounded body and exhaust the
 * process's memory; callers only persist a truncated response_body anyway.
 */
export const MAX_RESPONSE_BYTES = 64 * 1024;

function isIpLiteral(host: string): boolean {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.includes(":");
}

/**
 * Resolve a URL's hostname exactly once and return the validated address to
 * connect to. Every DNS answer is checked against the private/loopback ranges,
 * and a literal IP is validated synchronously, so callers can pin the socket
 * to the returned address without resolving again.
 *
 * Shared by pinnedFetch and the worker's TLS expiry probe (SEC-P2-001 /
 * CHAIN-P2-010), which used to re-resolve the host inside tls.connect.
 */
export async function resolvePinnedAddress(
  url: string,
): Promise<{ address: string; family: number }> {
  const parsed = new URL(url);
  const hostname = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, "");

  if (isIpLiteral(hostname)) {
    if (isPrivateIpAddress(hostname)) {
      throw new Error("URL resolves to a private or loopback address");
    }
    return { address: hostname, family: hostname.includes(":") ? 6 : 4 };
  }

  let answers: dns.LookupAddress[];
  try {
    answers = await dns.promises.lookup(hostname, { all: true });
  } catch {
    throw new Error("URL host could not be resolved");
  }
  if (answers.length === 0) {
    throw new Error("URL host could not be resolved");
  }
  for (const answer of answers) {
    if (isPrivateIpAddress(answer.address)) {
      throw new Error("URL resolves to a private or loopback address");
    }
  }
  // Pin the first validated answer for this connection.
  return { address: answers[0].address, family: answers[0].family };
}

/**
 * SEC-003 / SEC-P2-002: resolve the hostname exactly once, validate every
 * answer, then connect to the validated IP while preserving the original
 * hostname for TLS SNI / certificate verification and the Host header.
 *
 * The API path was pinned in #81, but the worker tasks still did a
 * guard-then-`fetch` (SEC-P2-002 partial): `assertSafeUrl(url)` resolved the
 * name, then `fetch(url)` resolved it again, leaving a DNS-rebinding TOCTOU
 * window where a host could answer with a public IP for the guard and a
 * private/loopback/metadata IP for the connection. Pinning the connection's
 * `lookup` closes that window. SEC-P2-001 / CHAIN-P2-010 extended the same
 * pinning to the monitoring checks (module-tasks) and the TLS expiry probe.
 *
 * Redirects are never followed (equivalent to `redirect: "manual"`).
 */
export async function pinnedFetch(
  url: string,
  init: PinnedFetchInit = {},
): Promise<PinnedResponse> {
  const parsed = new URL(url);
  const { address, family } = await resolvePinnedAddress(url);

  const requestFn: typeof http.request =
    parsed.protocol === "https:" ? (https.request as unknown as typeof http.request) : http.request;

  return new Promise<PinnedResponse>((resolve, reject) => {
    const lookup: NonNullable<http.RequestOptions["lookup"]> = (_hostname, _options, callback) => {
      (callback as (err: NodeJS.ErrnoException | null, addr: string, fam: number) => void)(
        null,
        address,
        family,
      );
    };

    const req = requestFn(
      url,
      {
        method: init.method ?? "GET",
        headers: init.headers,
        signal: init.signal,
        lookup,
      },
      (res: http.IncomingMessage) => {
        const chunks: Buffer[] = [];
        let received = 0;
        let settled = false;
        const finish = () => {
          if (settled) return;
          settled = true;
          resolve({
            status: res.statusCode ?? 0,
            text: async () => Buffer.concat(chunks).toString("utf8"),
          });
        };
        res.on("data", (chunk: Buffer) => {
          if (settled) return;
          // WH-P3-007: stop at the cap and close the stream instead of
          // buffering an unbounded response body.
          if (received >= MAX_RESPONSE_BYTES) {
            finish();
            res.destroy();
            return;
          }
          const remaining = MAX_RESPONSE_BYTES - received;
          if (chunk.length > remaining) {
            chunks.push(chunk.subarray(0, remaining));
            received = MAX_RESPONSE_BYTES;
            finish();
            res.destroy();
          } else {
            chunks.push(chunk);
            received += chunk.length;
          }
        });
        res.on("end", finish);
        res.on("close", finish);
        res.on("error", (err: Error) => {
          if (settled) return;
          settled = true;
          reject(err);
        });
      },
    );

    req.on("error", reject);
    if (init.body !== undefined) req.write(init.body);
    req.end();
  });
}
