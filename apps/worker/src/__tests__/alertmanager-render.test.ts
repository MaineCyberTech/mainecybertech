import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

/**
 * OBS-P3-005 regression: the Alertmanager template renderer must not corrupt
 * the config for secret values containing awk/YAML metacharacters.
 *
 * awk's gsub() replacement string expands "&" to the matched text and treats
 * "\" as an escape, so a webhook URL or password containing either character
 * used to corrupt the rendered config and the Alertmanager container exited.
 * The renderer (render-alertmanager.awk) substitutes with index/substr and then
 * escapes the value for the double-quoted YAML scalar it lands in; this test
 * runs it with metacharacter-laden values.
 */
const infraDir = path.resolve(__dirname, "../../../../infra/digitalocean");
const rendererPath = path.join(infraDir, "render-alertmanager.awk");
const templatePath = path.join(infraDir, "alertmanager.tmpl.yml");
const composePath = path.join(infraDir, "docker-compose.yml");

const VALUES = {
  ALERTMANAGER_DEFAULT_WEBHOOK_URL: "https://hooks.example.test/default?a=1&b=2",
  ALERTMANAGER_CRITICAL_WEBHOOK_URL: "https://ntfy.example.test/portal-alerts?x=1&y=2",
  ALERTMANAGER_WEBHOOK_USER: 'portal&"relay',
  ALERTMANAGER_WEBHOOK_PASS: "p\\a&s\\s&",
  ALERTMANAGER_WATCHDOG_WEBHOOK_URL: "https://hc-ping.example.test/abc&def\\ghi",
  ALERTMANAGER_SLACK_API_URL: "https://hooks.slack.test/services/a&b",
  ALERTMANAGER_SLACK_CHANNEL: "#alerts",
};

/** What the renderer must emit for a value inside a double-quoted YAML scalar. */
function yamlDoubleQuoted(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function render(): string {
  const result = spawnSync("awk", ["-f", rendererPath, templatePath], {
    env: { ...process.env, ...VALUES },
    encoding: "utf8",
  });
  expect(result.status).toBe(0);
  return String(result.stdout);
}

describe("alertmanager template renderer (OBS-P3-005)", () => {
  it("substitutes every placeholder on non-comment lines", () => {
    const surviving = render()
      .split("\n")
      .filter((line) => !line.trimStart().startsWith("#"))
      .filter((line) => line.includes("${ALERTMANAGER"));
    expect(surviving).toEqual([]);
  });

  it("renders & verbatim and escapes \\ and \" for the YAML scalar", () => {
    const rendered = render();
    for (const value of Object.values(VALUES)) {
      expect(rendered).toContain(yamlDoubleQuoted(value));
    }
    // The old gsub() bug replaced "&" with the matched placeholder text.
    expect(rendered).not.toContain("${ALERTMANAGER");
    expect(rendered).toContain('https://ntfy.example.test/portal-alerts?x=1&y=2"');
  });

  it("is mounted and executed by the alertmanager compose service", () => {
    const compose = fs.readFileSync(composePath, "utf8");
    expect(compose).toContain(
      "./render-alertmanager.awk:/etc/alertmanager/render-alertmanager.awk:ro",
    );
    expect(compose).toContain("awk -f /etc/alertmanager/render-alertmanager.awk");
  });
});
