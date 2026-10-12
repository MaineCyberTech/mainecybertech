// Shared k6 summary handler (TEST-P2-004).
//
// Every script exports `handleSummary` so CI gets two things:
//   - a compact threshold PASS/FAIL table on stdout (visible in the job log),
//   - the full metrics JSON at $SUMMARY_PATH when the workflow sets it, which
//     `load-test.yml` uploads as the recorded baseline artifact.
//
// k6 only treats a threshold breach as a run failure via the exit code (99);
// this handler does not change that — it exists to make the evidence readable.

export function buildSummary(data, label) {
  const thresholds = [];
  for (const [metric, m] of Object.entries(data.metrics)) {
    if (!m.thresholds) continue;
    for (const [expr, t] of Object.entries(m.thresholds)) {
      thresholds.push({ metric, expr, ok: t.ok === true });
    }
  }

  const lines = thresholds.map(
    (t) => `${t.ok ? "PASS" : "FAIL"} ${t.metric} ${t.expr}`,
  );
  const stdout = `[${label}] thresholds:\n${lines.join("\n") || "  (none defined)"}\n`;

  const out = { stdout };
  if (__ENV.SUMMARY_PATH) {
    out[__ENV.SUMMARY_PATH] = JSON.stringify(
      { label, thresholds, metrics: data.metrics },
      null,
      2,
    );
  }
  return out;
}
