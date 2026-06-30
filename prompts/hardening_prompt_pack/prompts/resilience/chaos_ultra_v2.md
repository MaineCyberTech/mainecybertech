RESILIENCE ULTRA — v2 (augmented checks)

## Additional Focus (beyond chaos_ultra.md)

- Degraded states over hard failures: e.g. DB 50% slow, not just fully down
- UI false success: client-side catch blocks that swallow partial errors
- Async breakdown: worker queue backpressure behavior
- Retry loops: exponential backoff verification

## Automation-only Checks (not in v1)

    - id: RES-006
      desc: "UI catch blocks not surfacing partial failures"
      grep: "catch.*console\.error"
      path: "apps/web/components/"
      expect: "check if bulk/list operations surface per-item errors to user"
