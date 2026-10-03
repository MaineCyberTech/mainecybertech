/**
 * Lightweight user-agent classification for the public visitor webhook.
 *
 * The `/public/init` endpoint is unauthenticated and is hit by search
 * crawlers, social link-preview bots, uptime monitors, and scanners — all of
 * which previously generated a "New Website Visitor" alert. This keeps the
 * signal (real people) and drops the noise.
 */

const BOT_PATTERNS: RegExp[] = [
  // Search + SEO crawlers
  /bot(?![a-z])/i,
  /crawler/i,
  /crawl/i,
  /spider/i,
  /slurp/i,
  /bingpreview/i,
  /applebot/i,
  /adsbot/i,
  /mediapartners-google/i,
  /google-inspectiontool/i,
  /apis-google/i,
  /google-read-aloud/i,
  /duckduckbot/i,
  /baiduspider/i,
  /yandex/i,
  /sogou/i,
  /exabot/i,
  /semrush/i,
  /ahrefs/i,
  /mj12bot/i,
  /dotbot/i,
  /petalbot/i,
  /bytespider/i,
  /gptbot/i,
  /ccbot/i,
  /claude-web/i,
  /anthropic-ai/i,
  // Social / preview / messaging unfurlers
  /facebookexternalhit/i,
  /facebookcatalog/i,
  /twitterbot/i,
  /linkedinbot/i,
  /whatsapp/i,
  /slackbot/i,
  /discordbot/i,
  /telegrambot/i,
  /embedly/i,
  /quora link preview/i,
  /pinterest/i,
  /redditbot/i,
  /skypeuripreview/i,
  /vkshare/i,
  /w3c_validator/i,
  // Uptime / monitoring / performance
  /uptimerobot/i,
  /pingdom/i,
  /statuscake/i,
  /betteruptime/i,
  /newrelicpinger/i,
  /site24x7/i,
  /datadog/i,
  /lighthouse/i,
  /gtmetrix/i,
  /headlesschrome/i,
  /phantomjs/i,
  /puppeteer/i,
  /playwright/i,
  /selenium/i,
  // HTTP clients / scanners / scripts
  /curl\//i,
  /wget/i,
  /python-requests/i,
  /python-urllib/i,
  /aiohttp/i,
  /httpx/i,
  /go-http-client/i,
  /okhttp/i,
  /java\//i,
  /libwww/i,
  /httpclient/i,
  /node-fetch/i,
  /axios\//i,
  /undici/i,
  /scrapy/i,
  /zgrab/i,
  /masscan/i,
  /nikto/i,
  /sqlmap/i,
  /nmap/i,
  /zmap/i,
  /nuclei/i,
];

/** True when the UA is missing or matches a known crawler/automation signature. */
export function isBotUserAgent(userAgent: string | null | undefined): boolean {
  if (!userAgent || !userAgent.trim()) return true;
  return BOT_PATTERNS.some((pattern) => pattern.test(userAgent));
}

/**
 * In-memory per-IP throttle for visitor alerts. Prevents a single source (or a
 * bot that rotates pages) from generating an alert on every request. The API
 * runs as a single container, so process-local state is sufficient.
 */
const ALERT_WINDOW_MS = 30 * 60 * 1000;
const lastAlertByIp = new Map<string, number>();

export function shouldSendVisitorAlert(
  ip: string,
  now: number = Date.now(),
  windowMs: number = ALERT_WINDOW_MS,
): boolean {
  const key = ip || "unknown";
  const last = lastAlertByIp.get(key);
  if (last !== undefined && now - last < windowMs) return false;
  lastAlertByIp.set(key, now);
  // Opportunistic prune so the map cannot grow unbounded.
  if (lastAlertByIp.size > 5000) {
    for (const [k, ts] of lastAlertByIp) {
      if (now - ts > windowMs) lastAlertByIp.delete(k);
    }
  }
  return true;
}

/** Test-only reset. */
export function __resetVisitorAlertThrottle(): void {
  lastAlertByIp.clear();
}
