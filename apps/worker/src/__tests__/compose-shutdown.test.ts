import fs from "node:fs";
import path from "node:path";

/**
 * RES-P2-009 regression: the production compose file must give the worker (and
 * API) a stop grace period at least as large as the worker's drain watchdog
 * (WORKER_SHUTDOWN_TIMEOUT_MS, default 30s). Docker's 10s default would
 * SIGKILL the worker mid-drain, killing in-flight jobs and redelivering them.
 */
describe("production compose shutdown budget", () => {
  const composePath = path.resolve(
    __dirname,
    "../../../../infra/digitalocean/docker-compose.yml",
  );

  it("sets stop_grace_period on api and worker above the default drain budget", () => {
    const compose = fs.readFileSync(composePath, "utf8");
    const gracePeriods = [...compose.matchAll(/stop_grace_period:\s*(\d+)s/g)].map((match) =>
      Number(match[1]),
    );

    expect(gracePeriods.length).toBeGreaterThanOrEqual(2);
    for (const seconds of gracePeriods) {
      expect(seconds).toBeGreaterThanOrEqual(30);
    }
  });
});
