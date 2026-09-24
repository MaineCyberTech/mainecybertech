import { jest } from "@jest/globals";
import {
  isBotUserAgent,
  shouldSendVisitorAlert,
  __resetVisitorAlertThrottle,
} from "../lib/bot-detection";

describe("isBotUserAgent", () => {
  it.each([
    "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)",
    "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
    "Twitterbot/1.0",
    "Mozilla/5.0 (compatible; SemrushBot/7~bl)",
    "Mozilla/5.0 (compatible; AhrefsBot/7.0)",
    "UptimeRobot/2.0",
    "curl/8.4.0",
    "python-requests/2.31.0",
    "Wget/1.21",
    "Mozilla/5.0 HeadlessChrome/120.0.0.0",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome-Lighthouse",
    "Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)",
    "GPTBot/1.0",
  ])("classifies crawler/automation UA as a bot: %s", (ua) => {
    expect(isBotUserAgent(ua)).toBe(true);
  });

  it.each([
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148",
  ])("treats a real browser UA as human: %s", (ua) => {
    expect(isBotUserAgent(ua)).toBe(false);
  });

  it("treats a missing or blank UA as a bot", () => {
    expect(isBotUserAgent(undefined)).toBe(true);
    expect(isBotUserAgent(null)).toBe(true);
    expect(isBotUserAgent("")).toBe(true);
    expect(isBotUserAgent("   ")).toBe(true);
  });
});

describe("shouldSendVisitorAlert", () => {
  beforeEach(() => __resetVisitorAlertThrottle());

  it("allows the first alert for an IP and throttles repeats inside the window", () => {
    const t0 = 1_000_000;
    expect(shouldSendVisitorAlert("1.2.3.4", t0)).toBe(true);
    expect(shouldSendVisitorAlert("1.2.3.4", t0 + 1000)).toBe(false);
    expect(shouldSendVisitorAlert("1.2.3.4", t0 + 29 * 60 * 1000)).toBe(false);
    expect(shouldSendVisitorAlert("1.2.3.4", t0 + 31 * 60 * 1000)).toBe(true);
  });

  it("tracks IPs independently", () => {
    const t0 = 2_000_000;
    expect(shouldSendVisitorAlert("1.1.1.1", t0)).toBe(true);
    expect(shouldSendVisitorAlert("2.2.2.2", t0)).toBe(true);
    expect(shouldSendVisitorAlert("1.1.1.1", t0 + 1000)).toBe(false);
  });
});
