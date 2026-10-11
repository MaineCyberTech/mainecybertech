import { jest } from "@jest/globals";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CONSENT_STORAGE_KEY, writeStoredConsent } from "@/lib/consent";
import ConsentProvider from "@/components/consent/ConsentProvider";
import AnalyticsScripts from "@/components/consent/AnalyticsScripts";
import ConsentBanner from "@/components/consent/ConsentBanner";
import CookieSettingsButton from "@/components/consent/CookieSettingsButton";

jest.mock("next/script", () => {
  const React = require("react") as typeof import("react");
  const MockScript = ({
    src,
    id,
    children,
  }: {
    src?: string;
    id?: string;
    children?: React.ReactNode;
  }) =>
    React.createElement(
      "div",
      {
        "data-testid": "third-party-script",
        "data-src": src ?? "",
        "data-id": id ?? "",
      } as any,
      typeof children === "string" ? children : null,
    );
  return { __esModule: true, default: MockScript };
});

function renderConsentTree() {
  return render(
    <ConsentProvider>
      <AnalyticsScripts gaId="G-TEST123" tawktoId="tawk-test/abc" nonce="test-nonce" />
      <ConsentBanner />
      <CookieSettingsButton />
    </ConsentProvider>,
  );
}

function scriptSources(): string[] {
  return Array.from(document.querySelectorAll('[data-testid="third-party-script"]')).map(
    (el) => el.getAttribute("data-src") ?? "",
  );
}

describe("consent-gated third-party scripts [PRIV-P2-001]", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("loads nothing and shows the banner before a choice is made", async () => {
    renderConsentTree();

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(scriptSources()).toEqual([]);
  });

  it("loads GA and Tawk.to only after accepting analytics", async () => {
    const user = userEvent.setup();
    renderConsentTree();

    await user.click(await screen.findByRole("button", { name: /accept analytics/i }));

    await waitFor(() =>
      expect(scriptSources()).toEqual(
        expect.arrayContaining([
          expect.stringContaining("googletagmanager.com"),
          expect.stringContaining("embed.tawk.to"),
        ]),
      ),
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(JSON.parse(window.localStorage.getItem(CONSENT_STORAGE_KEY) ?? "")).toMatchObject({
      version: 1,
      analytics: "granted",
    });
  });

  it("never loads scripts when analytics are rejected", async () => {
    const user = userEvent.setup();
    renderConsentTree();

    await user.click(await screen.findByRole("button", { name: /reject analytics/i }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(scriptSources()).toEqual([]);
  });

  it("loads scripts for a returning visitor with a stored grant", async () => {
    writeStoredConsent("granted");
    renderConsentTree();

    await waitFor(() =>
      expect(scriptSources()).toEqual(
        expect.arrayContaining([expect.stringContaining("googletagmanager.com")]),
      ),
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("respects a stored denial", async () => {
    writeStoredConsent("denied");
    renderConsentTree();

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(scriptSources()).toEqual([]);
  });

  it("reopens the banner from Cookie settings so a choice can be changed", async () => {
    writeStoredConsent("denied");
    const user = userEvent.setup();
    renderConsentTree();

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: /cookie settings/i }));

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /accept analytics/i }));

    await waitFor(() =>
      expect(scriptSources()).toEqual(
        expect.arrayContaining([expect.stringContaining("googletagmanager.com")]),
      ),
    );
  });
});
