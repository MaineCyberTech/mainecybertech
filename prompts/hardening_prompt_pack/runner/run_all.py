"""
Hardening Prompt Pack Engine v3 — Full autonomous execution
Executes all 8 domain prompts as real codebase analysis, then merges, reconciles, and computes global risk.
"""
import json, os, sys, re, datetime, subprocess, importlib.util
from collections import defaultdict

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
HARDENING_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENGINE_DIR = os.path.join(HARDENING_DIR, "engine")
OUTPUT_DIR = os.path.join(HARDENING_DIR, "engine", "outputs")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# --- Helpers ---

def run_git(cmd):
    r = subprocess.run(["git"] + cmd.split(), capture_output=True, text=True, cwd=REPO_ROOT)
    return r.stdout.strip()

def read_file(path):
    try:
        with open(path, "r", encoding="utf-8", errors="replace") as f:
            return f.read()
    except:
        return ""

def write_json(relpath, data):
    path = os.path.join(OUTPUT_DIR, relpath)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        json.dump(data, f, indent=2)
    return path

def write_text(relpath, text):
    path = os.path.join(OUTPUT_DIR, relpath)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(text)
    return path

def glob_files(pattern, root=None):
    import glob as g
    return g.glob(os.path.join(root or REPO_ROOT, pattern), recursive=True)

# ============================================================
# DOMAIN: SECURITY
# Prompt: scan API routes, auth flows, RBAC + tenancy, headers, secrets
# ============================================================

def scan_security():
    print("\n=== SECURITY: Full adversarial audit ===")
    findings = []

    api_src = os.path.join(REPO_ROOT, "apps", "api", "src")

    # Check auth middleware
    auth_path = os.path.join(api_src, "lib", "auth.ts")
    auth_content = read_file(auth_path)
    if auth_content:
        has_local_jwt = "jsonwebtoken" in auth_content
        has_supabase_fallback = "getUser" in auth_content
        has_cookie_flags = "httpOnly" in auth_content and "secure" in auth_content.lower()
        if not has_local_jwt:
            findings.append({"severity": "P1", "domain": "security", "file": "apps/api/src/lib/auth.ts", "issue": "No local JWT verification fast path", "impact": "Every request hits Supabase, increasing latency and dependency", "fix": "Add jsonwebtoken local verification with Supabase fallback"})
        if not has_cookie_flags:
            findings.append({"severity": "P1", "domain": "security", "file": "apps/api/src/lib/auth.ts", "issue": "Cookie missing HttpOnly/Secure/SameSite flags", "impact": "Cookie accessible to JS, XSS can steal session", "fix": "Set httpOnly=true, secure=true, sameSite='lax'"})

    # Check requireOrgAccess middleware usage
    routes_dir = os.path.join(api_src, "routes")
    public_route_files = {"docs.ts", "health.ts", "public.ts", "webhooks.ts"}
    unprotected = []
    if os.path.isdir(routes_dir):
        for f in sorted(os.listdir(routes_dir)):
            if f.endswith(".ts") and f not in public_route_files:
                content = read_file(os.path.join(routes_dir, f))
                if "requireOrgAccess" not in content and "requireAuth" not in content:
                    unprotected.append(f)
    if unprotected:
        findings.append({"severity": "P0", "domain": "security", "file": ", ".join(unprotected), "issue": "Route files missing auth/org middleware", "impact": "Unauthenticated access possible to these route modules", "fix": "Add requireAuth and requireOrgAccess middleware to all entity routes"})

    # Check security headers in API (helmet set in app.ts)
    app_api = read_file(os.path.join(api_src, "app.ts"))
    sec_headers_path = read_file(os.path.join(api_src, "middleware", "security-headers.ts"))
    combined_api_config = app_api + "\n" + sec_headers_path
    for header in ["Content-Security-Policy", "Strict-Transport-Security", "X-Content-Type-Options"]:
        if not ("helmet" in app_api or header.lower().replace("-","") in combined_api_config.lower().replace("-","")):
            findings.append({"severity": "P2", "domain": "security", "file": "apps/api/src/app.ts", "issue": f"Missing {header} header", "impact": "Reduced protection against common web attacks", "fix": f"Add helmet or manual {header} header"})

    # Check rate limiting in app.ts (not main.ts)
    has_rate_limit = "rate-limit" in app_api or "RateLimit" in app_api
    if not has_rate_limit:
        findings.append({"severity": "P1", "domain": "security", "file": "apps/api/src/app.ts", "issue": "No rate limiting on API", "impact": "Brute force and DoS attacks possible", "fix": "Add express-rate-limit middleware"})

    # Check tenant isolation on all entity routes
    entity_files = {"tickets.ts", "documents.ts", "projects.ts", "organizations.ts", "users.ts"}
    for ef in entity_files:
        ef_path = os.path.join(routes_dir, ef)
        if os.path.isfile(ef_path):
            content = read_file(ef_path)
            if "requireOrgAccess" not in content:
                findings.append({"severity": "P0", "domain": "security", "file": f"apps/api/src/routes/{ef}", "issue": "Missing tenant isolation (requireOrgAccess)", "impact": "Users can access cross-org records", "fix": "Add requireOrgAccess middleware to this router"})

    write_json("domain_security.json", {"domain": "security", "findings": findings, "count": len(findings)})
    print(f"  Security: {len(findings)} finding(s)")
    return findings


# ============================================================
# DOMAIN: DATA / DATA INTEGRITY
# Prompt: schema vs migrations vs runtime, relational integrity, concurrency
# ============================================================

def scan_data():
    print("\n=== DATA: Schema + integrity audit ===")
    findings = []

    mig_dir = os.path.join(REPO_ROOT, "supabase", "migrations")
    all_tables = set()
    table_map = {}

    if os.path.isdir(mig_dir):
        for f in sorted(os.listdir(mig_dir)):
            if f.endswith(".sql"):
                content = read_file(os.path.join(mig_dir, f))
                created = re.findall(r"CREATE\s+TABLE\s+(?:public\.)?(\w+)", content, re.I)
                altered = re.findall(r"ALTER\s+TABLE\s+(?:public\.)?(\w+)", content, re.I)
                for t in created:
                    all_tables.add(t)
                    table_map[t] = {"created_in": f, "altered_in": []}
                for t in altered:
                    if t in table_map:
                        table_map[t]["altered_in"].append(f)
                    else:
                        all_tables.add(t)
                        table_map[t] = {"created_in": "unknown", "altered_in": [f]}

    # Check for optimistic locking
    api_src = os.path.join(REPO_ROOT, "apps", "api", "src")
    has_optimistic_locking = False
    for root_dir, dirs, files in os.walk(api_src):
        dirs[:] = [d for d in dirs if d not in ("node_modules", ".pnpm", "__pycache__")]
        for f in files:
            if f.endswith(".ts"):
                content = read_file(os.path.join(root_dir, f))
                if "version" in content and ("If-Match" in content or "if-match" in content or "checkVersionMatch" in content):
                    has_optimistic_locking = True
    if not has_optimistic_locking:
        findings.append({"severity": "P1", "domain": "data", "file": "apps/api/src/routes/*.ts", "issue": "No optimistic locking on entity mutations", "impact": "Concurrent edits can silently overwrite each other", "fix": "Add version column + If-Match / checkVersionMatch to PATCH handlers"})

    # Check for transaction coverage
    has_transactions = False
    for root_dir, dirs, files in os.walk(api_src):
        dirs[:] = [d for d in dirs if d not in ("node_modules", ".pnpm", "__pycache__")]
        for f in files:
            if f.endswith(".ts"):
                content = read_file(os.path.join(root_dir, f))
                if "rpc(" in content and "transaction" in content.lower():
                    has_transactions = True
    if not has_transactions:
        findings.append({"severity": "P2", "domain": "data", "file": "apps/api/src/routes/*.ts", "issue": "No Supabase RPC transactions used for multi-step operations", "impact": "Partial writes possible on failure", "fix": "Wrap multi-step mutations in Supabase RPC transactions"})

    # Check for schema drift indicators
    api_table_refs = set()
    for root_dir, dirs, files in os.walk(api_src):
        dirs[:] = [d for d in dirs if d not in ("node_modules", ".pnpm", "__pycache__")]
        for f in files:
            if f.endswith(".ts"):
                content = read_file(os.path.join(root_dir, f))
                for t in all_tables:
                    if f"'{t}'" in content or f'"{t}"' in content or f".from({t}" in content:
                        api_table_refs.add(t)

    unused = all_tables - api_table_refs
    if unused:
        findings.append({"severity": "P2", "domain": "data", "file": "supabase/migrations/*.sql", "issue": f"Tables defined in migrations but never queried in API code: {', '.join(sorted(unused))}", "impact": "Dead schema or incomplete feature implementation", "fix": "Remove unused tables or add API queries"})

    write_json("domain_data.json", {"domain": "data", "findings": findings, "count": len(findings), "tables_found": len(all_tables)})
    print(f"  Data: {len(findings)} finding(s)")
    return findings


# ============================================================
# DOMAIN: RESILIENCE
# Prompt: degraded states, retry logic, async breakdown, UI false success
# ============================================================

def scan_resilience():
    print("\n=== RESILIENCE: Chaos engineering audit ===")
    findings = []

    web_src = os.path.join(REPO_ROOT, "apps", "web")
    api_src = os.path.join(REPO_ROOT, "apps", "api", "src")

    # Check for retry logic
    has_retry = False
    for root_dir, dirs, files in os.walk(api_src):
        dirs[:] = [d for d in dirs if d not in ("node_modules", ".pnpm", "__pycache__")]
        for f in files:
            if f.endswith(".ts"):
                content = read_file(os.path.join(root_dir, f))
                if "retry" in content.lower() and "maxRetries" in content or "retry" in content.lower() and "retries" in content.lower():
                    has_retry = True
    if not has_retry:
        findings.append({"severity": "P1", "domain": "resilience", "file": "apps/api/src/lib/*.ts", "issue": "No retry logic on external HTTP calls (Stripe, JSM, Teams)", "impact": "Transient failures cause permanent errors", "fix": "Add exponential backoff retry wrapper"})

    # Check for circuit breakers
    has_cb = False
    for root_dir, dirs, files in os.walk(api_src):
        dirs[:] = [d for d in dirs if d not in ("node_modules", ".pnpm", "__pycache__")]
        for f in files:
            if f.endswith(".ts"):
                content = read_file(os.path.join(root_dir, f))
                if "circuitBreaker" in content.lower() or "CircuitBreaker" in content:
                    has_cb = True
    if not has_cb:
        findings.append({"severity": "P1", "domain": "resilience", "file": "apps/api/src/lib/*.ts", "issue": "No circuit breaker on Supabase or external service calls", "impact": "Cascading failure from slow upstream service", "fix": "Add CircuitBreaker class wrapping Supabase client and HTTP calls"})

    # Check for timeout handling
    has_timeout = False
    for root_dir, dirs, files in os.walk(api_src):
        dirs[:] = [d for d in dirs if d not in ("node_modules", ".pnpm", "__pycache__")]
        for f in files:
            if f.endswith(".ts"):
                content = read_file(os.path.join(root_dir, f))
                if "timeout" in content.lower() and ("AbortSignal" in content or "AbortController" in content or "signal" in content):
                    has_timeout = True
    if not has_timeout:
        findings.append({"severity": "P2", "domain": "resilience", "file": "apps/api/src/routes/*.ts", "issue": "No request timeout on HTTP calls", "impact": "Requests can hang indefinitely, exhausting connections", "fix": "Add AbortSignal.timeout() to all fetch/HTTP calls"})

    # Check graceful shutdown
    main_api = read_file(os.path.join(api_src, "main.ts"))
    has_graceful = "SIGTERM" in main_api or "SIGINT" in main_api
    if not has_graceful:
        findings.append({"severity": "P0", "domain": "resilience", "file": "apps/api/src/main.ts", "issue": "No graceful shutdown handler", "impact": "Requests in flight are abruptly terminated on deploy", "fix": "Add SIGTERM/SIGINT handlers with server.close() and drain"})

    # Check for false success patterns in UI (bulk operations that swallow errors)
    web_components = os.path.join(web_src, "components")
    has_bulk_error = False
    if os.path.isdir(web_components):
        for root_dir, dirs, files in os.walk(web_components):
            dirs[:] = [d for d in dirs if d not in ("node_modules", ".pnpm", "__pycache__")]
            for f in files:
                if f.endswith((".tsx", ".ts")):
                    content = read_file(os.path.join(root_dir, f))
                    if "catch" in content and "console.error" in content and ".ok" not in content:
                        has_bulk_error = True
    if has_bulk_error:
        findings.append({"severity": "P2", "domain": "resilience", "file": "apps/web/components/*.tsx", "issue": "Bulk operations may show false success on partial failure", "impact": "UI reports success when some items failed", "fix": "Surface per-item {ok, error} results instead of catch+console.error"})

    write_json("domain_resilience.json", {"domain": "resilience", "findings": findings, "count": len(findings)})
    print(f"  Resilience: {len(findings)} finding(s)")
    return findings


# ============================================================
# DOMAIN: OBSERVABILITY
# Prompt: logs, tracing, metrics, blind spots
# ============================================================

def scan_observability():
    print("\n=== OBSERVABILITY: Logging + tracing audit ===")
    findings = []

    api_src = os.path.join(REPO_ROOT, "apps", "api", "src")

    # Check for structured logging
    has_pino = False
    has_logger = False
    for root_dir, dirs, files in os.walk(api_src):
        dirs[:] = [d for d in dirs if d not in ("node_modules", ".pnpm", "__pycache__")]
        for f in files:
            if f.endswith(".ts"):
                content = read_file(os.path.join(root_dir, f))
                if "pino" in content:
                    has_pino = True
                if "logger." in content:
                    has_logger = True

    if not has_pino:
        findings.append({"severity": "P1", "domain": "observability", "file": "apps/api/src/lib/*.ts", "issue": "No structured logging library (pino)", "impact": "Logs are unstructured, hard to search and correlate", "fix": "Install pino and create shared logger instance"})
    if not has_logger:
        findings.append({"severity": "P2", "domain": "observability", "file": "apps/api/src/routes/*.ts", "issue": "No logger usage in route handlers", "impact": "Failures are silent, no audit trail", "fix": "Add logger.error/warn calls to catch blocks"})

    # Check for request correlation IDs
    has_correlation = False
    for root_dir, dirs, files in os.walk(api_src):
        dirs[:] = [d for d in dirs if d not in ("node_modules", ".pnpm", "__pycache__")]
        for f in files:
            if f.endswith(".ts"):
                content = read_file(os.path.join(root_dir, f))
                if "X-Request-ID" in content or "x-request-id" in content or "correlationId" in content:
                    has_correlation = True
    if not has_correlation:
        findings.append({"severity": "P2", "domain": "observability", "file": "apps/api/src/main.ts", "issue": "No request correlation ID middleware", "impact": "Cannot trace requests across services", "fix": "Add X-Request-ID middleware with pino child logger"})

    # Check Sentry (initialized in app.ts, not main.ts)
    has_sentry_api = "initSentry" in read_file(os.path.join(api_src, "app.ts")) and "sentry" in read_file(os.path.join(api_src, "lib", "sentry.ts")).lower() if os.path.isfile(os.path.join(api_src, "lib", "sentry.ts")) else False
    has_sentry_web = "sentry" in read_file(os.path.join(REPO_ROOT, "apps", "web", "next.config.mjs")).lower() if os.path.isfile(os.path.join(REPO_ROOT, "apps", "web", "next.config.mjs")) else False
    if not has_sentry_api:
        findings.append({"severity": "P2", "domain": "observability", "file": "apps/api/src/app.ts", "issue": "No Sentry error tracking in API", "impact": "Unhandled errors are invisible to ops team", "fix": "Add @sentry/node initialization"})

    # Check health endpoints
    api_health = bool(glob_files("apps/api/src/routes/health.ts")) or bool(glob_files("apps/api/src/**/*health*"))
    worker_health = "health" in read_file(os.path.join(REPO_ROOT, "apps", "worker", "src", "main.ts")).lower() if os.path.isfile(os.path.join(REPO_ROOT, "apps", "worker", "src", "main.ts")) else False
    if not api_health:
        findings.append({"severity": "P2", "domain": "observability", "file": "apps/api/src/routes/health.ts", "issue": "Missing /health endpoint", "impact": "No way to check API liveness externally", "fix": "Add GET /health route returning ok status"})
    if not worker_health:
        findings.append({"severity": "P3", "domain": "observability", "file": "apps/worker/src/main.ts", "issue": "Missing worker health endpoint", "impact": "Worker liveness invisible to monitoring", "fix": "Add health server on HEALTH_PORT"})

    write_json("domain_observability.json", {"domain": "observability", "findings": findings, "count": len(findings)})
    print(f"  Observability: {len(findings)} finding(s)")
    return findings


# ============================================================
# DOMAIN: SUPPLY CHAIN
# Prompt: dependencies, packages, CI/CD artifacts
# ============================================================

def scan_supply_chain():
    print("\n=== SUPPLY CHAIN: Dependency audit ===")
    findings = []

    # Check root package.json for outdated/risky patterns
    root_pkg = json.loads(read_file(os.path.join(REPO_ROOT, "package.json")) or "{}")
    deps = {**root_pkg.get("dependencies", {}), **root_pkg.get("devDependencies", {})}

    risky_deps = []
    for name in deps:
        if name.startswith("@") or name.startswith("typescript"):
            continue
    # Check for packages with known security concerns
    for pkg_name in ["lodash", "moment", "request", "axios"]:
        if pkg_name in deps:
            risky_deps.append(pkg_name)
    if risky_deps:
        findings.append({"severity": "P2", "domain": "supply_chain", "file": "package.json", "issue": f"Potentially outdated/vulnerable dependencies: {', '.join(risky_deps)}", "impact": "Known CVEs in legacy packages", "fix": "Replace with modern alternatives or update to latest"})

    # Check for verify-install scripts
    has_install_script = any(pkg.get("scripts", {}).get("postinstall", "") for pkg_name, pkg in [("root", root_pkg)])
    if not has_install_script and False: pass  # postinstall itself is fine

    # Check for lockfile
    has_lockfile = os.path.isfile(os.path.join(REPO_ROOT, "pnpm-lock.yaml"))
    if not has_lockfile:
        findings.append({"severity": "P0", "domain": "supply_chain", "file": "pnpm-lock.yaml", "issue": "No lockfile committed", "impact": "Non-reproducible builds, supply chain risk", "fix": "Commit pnpm-lock.yaml"})

    # Check Dependabot
    has_dependabot = os.path.isfile(os.path.join(REPO_ROOT, ".github", "dependabot.yml"))
    if not has_dependabot:
        findings.append({"severity": "P2", "domain": "supply_chain", "file": ".github/dependabot.yml", "issue": "No Dependabot config", "impact": "No automated vulnerability scanning for dependencies", "fix": "Add .github/dependabot.yml with npm and GHA schedules"})

    # Check Dockerfile patterns
    for app in ["api", "web", "worker"]:
        df_path = os.path.join(REPO_ROOT, "apps", app, "Dockerfile")
        if os.path.isfile(df_path):
            df = read_file(df_path)
            if "COPY --from=root" not in df and "COPY pnpm-lock" not in df:
                findings.append({"severity": "P3", "domain": "supply_chain", "file": f"apps/{app}/Dockerfile", "issue": "Dockerfile does not leverage layer caching for dependencies", "impact": "Slower builds, unnecessary rebuilds", "fix": "Copy lockfile and package.json separately before source"})

    write_json("domain_supply_chain.json", {"domain": "supply_chain", "findings": findings, "count": len(findings)})
    print(f"  Supply Chain: {len(findings)} finding(s)")
    return findings


# ============================================================
# DOMAIN: PRIVACY
# Prompt: PII handling, retention, leaks, compliance
# ============================================================

def scan_privacy():
    print("\n=== PRIVACY: Data protection audit ===")
    findings = []

    api_src = os.path.join(REPO_ROOT, "apps", "api", "src")
    web_src = os.path.join(REPO_ROOT, "apps", "web")

    # Check for PII fields in schema/migrations
    mig_dir = os.path.join(REPO_ROOT, "supabase", "migrations")
    pii_columns = set()
    pii_patterns = ["email", "phone", "address", "ssn", "birth", "name"]
    if os.path.isdir(mig_dir):
        for f in sorted(os.listdir(mig_dir)):
            if f.endswith(".sql"):
                content = read_file(os.path.join(mig_dir, f)).lower()
                for pat in pii_patterns:
                    if pat in content:
                        pii_columns.add(pat)

    # Check audit logging for PII access
    has_audit_log = False
    for root_dir, dirs, files in os.walk(api_src):
        dirs[:] = [d for d in dirs if d not in ("node_modules", ".pnpm", "__pycache__")]
        for f in files:
            if f.endswith(".ts"):
                content = read_file(os.path.join(root_dir, f))
                if "audit_logs" in content or "logAuditEvent" in content:
                    has_audit_log = True
    if not has_audit_log:
        findings.append({"severity": "P1", "domain": "privacy", "file": "apps/api/src/routes/*.ts", "issue": "No audit logging on mutation endpoints", "impact": "Cannot track who accessed/modified PII", "fix": "Add logAuditEvent to all mutation endpoints"})

    # Check for cookie security on session
    auth_file = read_file(os.path.join(api_src, "lib", "auth.ts"))
    has_secure_cookie = "secure" in auth_file.lower() and "httpOnly" in auth_file.lower()
    if not has_secure_cookie:
        findings.append({"severity": "P1", "domain": "privacy", "file": "apps/api/src/lib/auth.ts", "issue": "Session cookie missing Secure/HttpOnly flags", "impact": "Session token exposed to network sniffing or XSS", "fix": "Set cookie with httpOnly=true, secure=true, sameSite='lax'"})

    # Check for PII in logs
    has_log_sanitization = False
    for root_dir, dirs, files in os.walk(api_src):
        dirs[:] = [d for d in dirs if d not in ("node_modules", ".pnpm", "__pycache__")]
        for f in files:
            if f.endswith(".ts"):
                content = read_file(os.path.join(root_dir, f))
                if "logger." in content and ("email" in content.lower() or "password" in content.lower() or "token" in content.lower()):
                    has_log_sanitization = True
    if has_log_sanitization:
        findings.append({"severity": "P3", "domain": "privacy", "file": "apps/api/src/routes/*.ts", "issue": "Possible PII logged via logger calls", "impact": "Sensitive data may appear in log output", "fix": "Add log sanitization wrapper to redact emails/tokens"})

    write_json("domain_privacy.json", {"domain": "privacy", "findings": findings, "count": len(findings)})
    print(f"  Privacy: {len(findings)} finding(s)")
    return findings


# ============================================================
# DOMAIN: CI/CD
# Prompt: GitHub Actions, secrets, permissions, branch protection
# ============================================================

def scan_cicd():
    print("\n=== CI/CD: Pipeline security audit ===")
    findings = []

    workflows_dir = os.path.join(REPO_ROOT, ".github", "workflows")

    if os.path.isdir(workflows_dir):
        has_prod_gate = False
        has_secret_scan = False
        has_approval = False
        for f in sorted(os.listdir(workflows_dir)):
            if f.endswith((".yml", ".yaml")):
                content = read_file(os.path.join(workflows_dir, f))
                if "prod-approval" in content.lower() or "environment: prod" in content.lower():
                    has_prod_gate = True
                if "environment:" in content.lower() and "approval" in content.lower():
                    has_approval = True

        if not has_prod_gate:
            findings.append({"severity": "P1", "domain": "ci_cd", "file": ".github/workflows/deploy*.yml", "issue": "No production approval gate", "impact": "Code can be deployed to production without review", "fix": "Add GitHub environment 'prod' with required reviewers"})
        if not has_approval:
            findings.append({"severity": "P2", "domain": "ci_cd", "file": ".github/workflows/*.yml", "issue": "No environment approval gates on any workflow", "impact": "All deployments are automatic", "fix": "Add environment blocks with required reviewers to prod workflows"})

    # Check for secret exposure in workflow files
    for f in sorted(os.listdir(workflows_dir)) if os.path.isdir(workflows_dir) else []:
        if f.endswith((".yml", ".yaml")):
            content = read_file(os.path.join(workflows_dir, f))
            secrets_in_run = re.findall(r"run:.*?\${{.*?secrets\.", content, re.I)
            if secrets_in_run:
                findings.append({"severity": "P2", "domain": "ci_cd", "file": f".github/workflows/{f}", "issue": "Secrets used in run: commands may appear in logs", "impact": "Secret values leaked to CI log output", "fix": "Use env: block to pass secrets instead of inline substitution"})

    # Check test coverage in workflows
    has_test_job = False
    has_lint_job = False
    for f in sorted(os.listdir(workflows_dir)) if os.path.isdir(workflows_dir) else []:
        if f.endswith((".yml", ".yaml")):
            content = read_file(os.path.join(workflows_dir, f))
            if "test" in content.lower() and ("jest" in content.lower() or "playwright" in content.lower() or "vitest" in content.lower() or "pnpm test" in content.lower()):
                has_test_job = True
            if "lint" in content.lower():
                has_lint_job = True

    if not has_test_job:
        findings.append({"severity": "P1", "domain": "ci_cd", "file": ".github/workflows/*.yml", "issue": "No test job in CI workflows", "impact": "Broken code can be deployed without testing", "fix": "Add test workflow running pnpm test"})
    if not has_lint_job:
        findings.append({"severity": "P3", "domain": "ci_cd", "file": ".github/workflows/*.yml", "issue": "No lint job in CI workflows", "impact": "Code quality issues not caught in CI", "fix": "Add lint workflow running pnpm lint"})

    write_json("domain_cicd.json", {"domain": "ci_cd", "findings": findings, "count": len(findings)})
    print(f"  CI/CD: {len(findings)} finding(s)")
    return findings


# ============================================================
# DOMAIN: EVOLUTION / PLATFORM
# Prompt: UX gaps, performance, architectural inefficiencies
# ============================================================

def scan_evolution():
    print("\n=== EVOLUTION: Architecture + UX audit ===")
    findings = []

    web_src = os.path.join(REPO_ROOT, "apps", "web")

    # Check for loading states
    has_loading = False
    for root_dir, dirs, files in os.walk(web_src):
        dirs[:] = [d for d in dirs if d not in ("node_modules", ".pnpm", ".next", "__pycache__")]
        for f in files:
            if f == "loading.tsx":
                has_loading = True
    if not has_loading:
        findings.append({"severity": "P2", "domain": "evolution", "file": "apps/web/app/**/*.tsx", "issue": "No loading.tsx skeletons in route groups", "impact": "Users see blank screen during page load", "fix": "Add loading.tsx with skeleton UI to each route group"})

    # Check for error boundaries
    has_error_page = False
    for root_dir, dirs, files in os.walk(os.path.join(web_src, "app")):
        for f in files:
            if f == "error.tsx":
                has_error_page = True
    if not has_error_page:
        findings.append({"severity": "P2", "domain": "evolution", "file": "apps/web/app/**/*.tsx", "issue": "No route-level error.tsx boundaries", "impact": "Unhandled errors crash the full page", "fix": "Add error.tsx with retry button to each route group"})

    # Check for not-found page
    has_404 = os.path.isfile(os.path.join(web_src, "app", "not-found.tsx"))
    if not has_404:
        findings.append({"severity": "P3", "domain": "evolution", "file": "apps/web/app/not-found.tsx", "issue": "No custom 404 page", "impact": "Users see generic browser error on missing pages", "fix": "Add not-found.tsx with helpful navigation"})

    # Check for page metadata/titles
    pages_with_title = 0
    pages_total = 0
    for root_dir, dirs, files in os.walk(os.path.join(web_src, "app")):
        for f in files:
            if f == "page.tsx":
                pages_total += 1
                content = read_file(os.path.join(root_dir, f))
                if "export const metadata" in content or "generateMetadata" in content or "<title>" in content:
                    pages_with_title += 1
    if pages_total > 0 and pages_with_title < pages_total:
        findings.append({"severity": "P3", "domain": "evolution", "file": "apps/web/app/**/page.tsx", "issue": f"Only {pages_with_title}/{pages_total} pages have metadata/title tags", "impact": "Poor SEO and tab identification", "fix": "Add export const metadata with title to all pages"})

    # Check for component EmptyState pattern
    has_empty_state = False
    for root_dir, dirs, files in os.walk(os.path.join(web_src, "components")):
        for f in files:
            if f.endswith(".tsx"):
                content = read_file(os.path.join(root_dir, f))
                if "EmptyState" in content or "empty" in content.lower():
                    has_empty_state = True
    if not has_empty_state:
        findings.append({"severity": "P3", "domain": "evolution", "file": "apps/web/components/**/*.tsx", "issue": "No EmptyState component for empty lists", "impact": "Users see blank areas instead of helpful empty messages", "fix": "Create EmptyState component with icon, title, description, action"})

    # Check for markdown rendering in comments
    has_markdown = False
    for root_dir, dirs, files in os.walk(os.path.join(web_src, "components")):
        for f in files:
            if f.endswith(".tsx"):
                content = read_file(os.path.join(root_dir, f))
                if "markdown" in content.lower() or "remark" in content.lower() or "react-markdown" in content.lower():
                    has_markdown = True
    if not has_markdown:
        findings.append({"severity": "P3", "domain": "evolution", "file": "apps/web/components/**/*.tsx", "issue": "No markdown rendering in comment sections", "impact": "Users cannot format ticket/project comments", "fix": "Add CommentBody component with basic markdown (bold, italic, links, lists)"})

    # Check for caching
    api_src = os.path.join(REPO_ROOT, "apps", "api", "src")
    has_cache = False
    for root_dir, dirs, files in os.walk(api_src):
        for f in files:
            if f.endswith(".ts"):
                content = read_file(os.path.join(root_dir, f))
                if "cache" in content.lower() and ("set" in content.lower() or "get" in content.lower()):
                    has_cache = True
    if not has_cache:
        findings.append({"severity": "P2", "domain": "evolution", "file": "apps/api/src/middleware/*.ts", "issue": "No API response caching", "impact": "Every request hits the database, increased latency", "fix": "Add in-memory or Redis-based response cache middleware"})

    write_json("domain_evolution.json", {"domain": "evolution", "findings": findings, "count": len(findings)})
    print(f"  Evolution: {len(findings)} finding(s)")
    return findings


# ============================================================
# MERGER — merge all domain findings
# Prompt: dedupe, normalize severity, merge related issues into chains
# ============================================================

def merge_findings(all_domain_findings):
    print("\n=== MERGER: Combining all domain findings ===")

    # Use existing merge engine
    sys.path.insert(0, ENGINE_DIR)
    try:
        from merge.merge_findings import merge_all
        merged = merge_all(*all_domain_findings)
    except ImportError:
        merged = []
        for domain_list in all_domain_findings:
            merged.extend(domain_list)

    write_json("global_findings.json", {
        "total": len(merged),
        "generated_at": datetime.datetime.now(datetime.UTC).isoformat(),
        "findings": merged,
    })

    # Group by severity for P0 blockers list
    p0_blockers = [f for f in merged if f.get("severity") == "P0"]
    write_json("global_p0_blockers.json", {
        "count": len(p0_blockers),
        "blockers": p0_blockers,
    })

    # Risk clusters by domain
    clusters = defaultdict(list)
    for f in merged:
        clusters[f.get("domain", "unknown")].append(f)
    risk_clusters = {k: {"count": len(v), "p0": sum(1 for f in v if f.get("severity")=="P0"), "findings": v} for k, v in clusters.items()}
    write_json("risk_clusters.json", risk_clusters)

    print(f"  Merger: {len(merged)} findings ({len(p0_blockers)} P0 blockers)")
    return merged


# ============================================================
# RECONCILIATION — resolve contradictions, validate consistency
# Prompt: deduplicate by file+issue, resolve conflicts
# ============================================================

def reconcile_findings(merged):
    print("\n=== RECONCILIATION: Deduplicating + resolving ===")

    # Use existing reconcile engine
    sys.path.insert(0, ENGINE_DIR)
    try:
        from reconciliation.reconcile import reconcile
        reconciled = reconcile(merged)
    except ImportError:
        # Manual dedup
        seen = set()
        reconciled = []
        for f in merged:
            key = (f.get("file", ""), f.get("issue", ""))
            if key not in seen:
                seen.add(key)
                reconciled.append(f)

    # Build final action plan
    action_plan = []
    for f in reconciled:
        action_plan.append({
            "severity": f.get("severity", "P3"),
            "domain": f.get("domain", "unknown"),
            "file": f.get("file", ""),
            "issue": f.get("issue", ""),
            "action": f.get("fix", "Review and remediate"),
            "effort": "small" if f.get("severity") == "P3" else ("medium" if f.get("severity") == "P2" else "large"),
        })

    write_json("reconciled_findings.json", {
        "total": len(reconciled),
        "deduped_from": len(merged),
        "findings": reconciled,
    })
    write_json("final_action_plan.json", {
        "total_actions": len(action_plan),
        "actions": action_plan,
    })

    print(f"  Reconciliation: {len(reconciled)} findings (deduped from {len(merged)})")
    return reconciled


# ============================================================
# GLOBAL RISK — compute system risk score
# ============================================================

def compute_global_risk(reconciled):
    print("\n=== GLOBAL RISK: Computing system risk score ===")

    # Use existing risk engine
    sys.path.insert(0, ENGINE_DIR)
    try:
        from global_risk.global_risk_engine import compute_global_risk
        risk = compute_global_risk(reconciled)
    except ImportError:
        p0 = sum(1 for f in reconciled if f.get("severity") == "P0")
        p1 = sum(1 for f in reconciled if f.get("severity") == "P1")
        score = max(0, 100 - (p0 * 40 + p1 * 10))
        risk = {"p0": p0, "p1": p1, "score": score}

    severity_counts = defaultdict(int)
    domain_counts = defaultdict(int)
    for f in reconciled:
        severity_counts[f.get("severity", "P3")] += 1
        domain_counts[f.get("domain", "unknown")] += 1

    risk.update({
        "p2": severity_counts.get("P2", 0),
        "p3": severity_counts.get("P3", 0),
        "total": len(reconciled),
        "domain_breakdown": dict(domain_counts),
        "timestamp": datetime.datetime.now(datetime.UTC).isoformat(),
        "commit": run_git("log --oneline -1"),
        "blocked": risk.get("p0", 0) > 0,
    })

    write_json("system_risk_score.json", risk)
    print(f"  Risk score: {risk.get('score', 0)}/100 (P0={risk.get('p0', 0)}, P1={risk.get('p1', 0)})")
    return risk


# ============================================================
# GENERATE OUTPUTS — dashboard, reports, badges
# ============================================================

def generate_outputs(reconciled, risk):
    print("\n=== GENERATING OUTPUTS ===")

    severity_counts = defaultdict(int)
    domain_counts = defaultdict(int)
    for f in reconciled:
        severity_counts[f.get("severity", "P3")] += 1
        domain_counts[f.get("domain", "unknown")] += 1

    p0 = severity_counts.get("P0", 0)
    p1 = severity_counts.get("P1", 0)
    p2 = severity_counts.get("P2", 0)
    p3 = severity_counts.get("P3", 0)

    # Global Report (from template)
    report = f"""# Global Risk Report

**Generated:** {risk.get('timestamp', 'N/A')}
**Commit:** {risk.get('commit', 'N/A')}
**Risk Score:** {risk.get('score', 0)}/100
**Status:** {'BLOCKED' if risk.get('blocked') else 'PASSED'}

## Summary

| Severity | Count |
|----------|-------|
| P0 (Critical) | {p0} |
| P1 (High) | {p1} |
| P2 (Medium) | {p2} |
| P3 (Low) | {p3} |
| **Total** | **{len(reconciled)}** |

## By Domain

| Domain | Count | P0 |
|--------|-------|-----|
"""
    for domain, count in sorted(domain_counts.items()):
        p0_in_domain = sum(1 for f in reconciled if f.get("domain") == domain and f.get("severity") == "P0")
        report += f"| {domain} | {count} | {p0_in_domain} |\n"

    report += "\n## Key Blockers\n"
    blockers = [f for f in reconciled if f.get("severity") == "P0"]
    if blockers:
        for b in blockers:
            report += f"- **{b.get('domain','?')}**: {b.get('issue','?')} - {b.get('file','?')}\n"
    else:
        report += "No P0 blockers. System is clear for deployment.\n"

    report += "\n---\n*Generated by Hardening Prompt Pack Engine v3*"
    write_text("global_report.md", report)

    # Remediation Plan (from template)
    remediation = "# Remediation Plan\n\n"
    remediation += "| Severity | Domain | File | Issue | Fix | Effort |\n"
    remediation += "|----------|--------|------|-------|-----|--------|\n"
    for f in sorted(reconciled, key=lambda x: (x.get("severity", "P3"), x.get("domain", ""))):
        effort = "small" if f.get("severity") == "P3" else ("medium" if f.get("severity") == "P2" else "large")
        remediation += f"| {f.get('severity','P3')} | {f.get('domain','?')} | {f.get('file','?')} | {f.get('issue','?')} | {f.get('fix','?')} | {effort} |\n"
    write_text("remediation_plan.md", remediation)

    # HTML Dashboard
    score_class = "high" if risk.get("score", 0) >= 80 else ("mid" if risk.get("score", 0) >= 50 else "low")
    html = f"""<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Hardening Dashboard</title>
<style>
body {{ font-family: system-ui, sans-serif; max-width: 800px; margin: 2em auto; background: #0f172a; color: #e2e8f0; }}
h1 {{ color: #059669; }}
.score {{ font-size: 4em; font-weight: bold; text-align: center; }}
.score.high {{ color: #22c55e; }} .score.mid {{ color: #eab308; }} .score.low {{ color: #ef4444; }}
.badge {{ display: inline-block; padding: .25em .75em; border-radius: 999px; font-size: .875em; }}
.p0 {{ background: #ef4444; color: #fff; }} .p1 {{ background: #f97316; color: #fff; }}
.p2 {{ background: #eab308; color: #000; }} .p3 {{ background: #64748b; color: #fff; }}
table {{ width: 100%; border-collapse: collapse; margin: 1em 0; }}
th, td {{ border: 1px solid #334155; padding: .5em; text-align: left; }}
th {{ background: #1e293b; }}
</style></head>
<body>
<h1>Hardening Prompt Pack Dashboard v3</h1>
<div class="score {score_class}">{risk.get('score', 0)}<small>/100</small></div>
<p style="text-align:center"><strong>Decision:</strong> {'BLOCKED' if risk.get('blocked') else 'PASSED'}</p>
<table>
<tr><th>Severity</th><th>Count</th></tr>
<tr><td><span class="badge p0">P0</span></td><td>{p0}</td></tr>
<tr><td><span class="badge p1">P1</span></td><td>{p1}</td></tr>
<tr><td><span class="badge p2">P2</span></td><td>{p2}</td></tr>
<tr><td><span class="badge p3">P3</span></td><td>{p3}</td></tr>
<tr><td><strong>Total</strong></td><td><strong>{len(reconciled)}</strong></td></tr>
</table>
<h2>Domains</h2>
<table>
<tr><th>Domain</th><th>Count</th><th>P0</th></tr>
"""
    for domain, count in sorted(domain_counts.items()):
        p0_in = sum(1 for f in reconciled if f.get("domain") == domain and f.get("severity") == "P0")
        html += f"<tr><td>{domain}</td><td>{count}</td><td>{p0_in}</td></tr>\n"
    html += "</table></body></html>"
    write_text("dashboard.html", html)

    # Badges data
    write_json("badges_data.json", {
        "p0": p0, "p1": p1, "p2": p2, "p3": p3,
        "risk_score": risk.get("score", 0),
        "status": "BLOCKED" if risk.get("blocked") else "PASSED",
        "total": len(reconciled),
    })

    # PR comment
    pr = f"""## Hardening Prompt Pack Audit Results

### Global Risk Score: {risk.get('score', 0)}/100
### Status: {'BLOCKED - Do Not Deploy' if risk.get('blocked') else 'PASSED'}

| Severity | Count |
|----------|-------|
| P0 | {p0} |
| P1 | {p1} |
| P2 | {p2} |
| P3 | {p3} |
| **Total** | **{len(reconciled)}** |

### Domain Breakdown
"""
    for domain, count in sorted(domain_counts.items()):
        pr += f"- **{domain}**: {count} findings\n"

    if reconciled:
        pr += "\n### Key Findings\n"
        for f in reconciled[:15]:
            pr += f"- **[P{f.get('severity','3')}]** {f.get('domain','?')}: {f.get('issue','?')} ({f.get('file','?')})\n"
        if len(reconciled) > 15:
            pr += f"\n*...and {len(reconciled) - 15} more findings*\n"

    write_text("pr_comment.md", pr)
    print(f"  Dashboard generated: {len(reconciled)} findings, score={risk.get('score', 0)}")


# ============================================================
# UPDATE HISTORY
# ============================================================

def update_history(risk, reconciled):
    severity_counts = defaultdict(int)
    for f in reconciled:
        severity_counts[f.get("severity", "P3")] += 1

    history = {
        "last_run": risk.get("timestamp", datetime.datetime.now(datetime.UTC).isoformat()),
        "commit": risk.get("commit", "unknown"),
        "risk_score": risk.get("score", 0),
        "p0": severity_counts.get("P0", 0),
        "p1": severity_counts.get("P1", 0),
        "p2": severity_counts.get("P2", 0),
        "p3": severity_counts.get("P3", 0),
        "total": len(reconciled),
        "status": "BLOCKED" if risk.get("blocked") else "PASSED",
    }

    history_path = os.path.join(HARDENING_DIR, "engine", "history", "history_store.json")
    os.makedirs(os.path.dirname(history_path), exist_ok=True)
    with open(history_path, "w") as f:
        json.dump(history, f, indent=2)

    # Update/check phase config
    config_path = os.path.join(HARDENING_DIR, "runner", "phases", "phase_config.json")
    if os.path.isfile(config_path):
        with open(config_path) as f:
            config = json.load(f)
    else:
        config = {"phases": ["security", "data", "resilience", "observability", "supply_chain", "privacy", "ci_cd", "evolution"]}
        os.makedirs(os.path.dirname(config_path), exist_ok=True)
        with open(config_path, "w") as f:
            json.dump(config, f, indent=2)
    config["last_run"] = history["last_run"]
    config["outputs"] = {
        "global_findings": "engine/outputs/global_findings.json",
        "reconciled_findings": "engine/outputs/reconciled_findings.json",
        "system_risk_score": "engine/outputs/system_risk_score.json",
        "risk_score": history["risk_score"],
        "status": history["status"],
    }
    with open(config_path, "w") as f:
        json.dump(config, f, indent=2)

    return history


# ============================================================
# MAIN
# ============================================================

def main():
    print("=" * 60)
    print("  HARDENING PROMPT PACK ENGINE v3 — FULL ANALYSIS RUN")
    print("=" * 60)
    print(f"  Repo:  {REPO_ROOT}")
    print(f"  Time:  {datetime.datetime.now(datetime.UTC).isoformat()}")
    print(f"  Commit: {run_git('log --oneline -1')}")
    print(f"  Branch: {run_git('rev-parse --abbrev-ref HEAD')}")
    print("=" * 60)

    # Phase 1-8: Run all 8 domain scans
    print("\n>>>> EXECUTING 8 DOMAIN SCANS <<<<")

    all_domains = []

    all_domains.append(scan_security())
    all_domains.append(scan_data())
    all_domains.append(scan_resilience())
    all_domains.append(scan_observability())
    all_domains.append(scan_supply_chain())
    all_domains.append(scan_privacy())
    all_domains.append(scan_cicd())
    all_domains.append(scan_evolution())

    # Merge all domain findings
    merged = merge_findings(all_domains)

    # Reconcile
    reconciled = reconcile_findings(merged)

    # Compute global risk
    risk = compute_global_risk(reconciled)

    # Generate outputs
    generate_outputs(reconciled, risk)

    # Update history
    update_history(risk, reconciled)

    # Print summary
    severity_counts = defaultdict(int)
    domain_counts = defaultdict(int)
    for f in reconciled:
        severity_counts[f.get("severity", "P3")] += 1
        domain_counts[f.get("domain", "unknown")] += 1

    print("\n" + "=" * 60)
    print("  HARDENING ENGINE RUN COMPLETE")
    print("=" * 60)
    print(f"  Total findings: {len(reconciled)} (deduped from {len(merged)})")
    print(f"  P0: {severity_counts.get('P0',0)} | P1: {severity_counts.get('P1',0)} | P2: {severity_counts.get('P2',0)} | P3: {severity_counts.get('P3',0)}")
    print(f"  Global Risk Score: {risk.get('score', 0)}/100")
    print(f"  Status: {'BLOCKED' if risk.get('blocked') else 'PASSED'}")
    print(f"  Domains: {', '.join(sorted(domain_counts.keys()))}")
    print(f"  Outputs: {OUTPUT_DIR}")
    print("=" * 60)


if __name__ == "__main__":
    main()
