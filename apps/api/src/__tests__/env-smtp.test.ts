import { assertProductionSmtp } from "../config/env";

describe("env production SMTP boot assertion [NOTIF-P2-002]", () => {
  it("accepts a configured SMTP host in production", () => {
    expect(() =>
      assertProductionSmtp({
        NODE_ENV: "production",
        SMTP_HOST: "smtp.example.com",
      }),
    ).not.toThrow();
  });

  it("throws at boot when production has no SMTP host", () => {
    expect(() =>
      assertProductionSmtp({ NODE_ENV: "production", SMTP_HOST: undefined }),
    ).toThrow(/SMTP_HOST/);
  });

  it("does not require SMTP outside production", () => {
    expect(() =>
      assertProductionSmtp({ NODE_ENV: "development", SMTP_HOST: undefined }),
    ).not.toThrow();
    expect(() =>
      assertProductionSmtp({ NODE_ENV: "test", SMTP_HOST: undefined }),
    ).not.toThrow();
  });
});
