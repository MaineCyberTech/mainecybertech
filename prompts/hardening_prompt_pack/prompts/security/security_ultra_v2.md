PRINCIPAL SECURITY ULTRA PROMPT — v2 (augmented checks)

## Additional Focus (beyond security_ultra.md)

- Exploit chain modeling: chain multiple low-severity issues into a viable attack
- Categories: auth, tenancy, validation, exposure, infra
- Output: findings + attack paths + remediation per findings_schema.json

## Automation-only Checks (not in v1)

    - id: SEC-005
      desc: "Auth rate limit is per-IP only — check for per-email limit"
      grep: "rateLimitAuth"
      path: "apps/api/src/middleware/rate-limit.ts"
      expect: "rateLimitAuth uses ip-based keyGenerator only; no email-based limit"
    - id: SEC-006
      desc: "Webhook endpoints verify signatures"
      grep: "constructEvent|verifySignature"
      path: "apps/api/src/routes/webhooks.ts"
      expect: "stripe.webhooks.constructEvent() called with raw body"
