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
  body?: string;
  signal?: AbortSignal;
};

function isIpLiteral(host: string): boolean {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.includes(":");
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
 * `lookup` closes that window.
 *
 * Redirects are never followed (equivalent to `redirect: "manual"`).
 */
export async function pinnedFetch(
  url: string,
  init: PinnedFetchInit = {},
): Promise<PinnedResponse> {
  const parsed = new URL(url);
  const hostname = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, "");

  let address: string;
  let family: number;
  if (isIpLiteral(hostname)) {
    // Literal IP: the synchronous SSRF guard already vetted it.
    address = hostname;
    family = hostname.includes(":") ? 6 : 4;
  } else {
    let answers: dns.LookupAddress[];
    try {
      answers = await dns.promises.lookup(hostname, { all: true });
    } catch {
      throw new Error("Webhook URL host could not be resolved");
    }
    if (answers.length === 0) {
      throw new Error("Webhook URL host could not be resolved");
    }
    for (const answer of answers) {
      if (isPrivateIpAddress(answer.address)) {
        throw new Error("Webhook URL resolves to a private or loopback address");
      }
    }
    // Pin the first validated answer for this connection.
    address = answers[0].address;
    family = answers[0].family;
  }

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
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () => {
          resolve({
            status: res.statusCode ?? 0,
            text: async () => Buffer.concat(chunks).toString("utf8"),
          });
        });
        res.on("error", reject);
      },
    );

    req.on("error", reject);
    if (init.body !== undefined) req.write(init.body);
    req.end();
  });
}
