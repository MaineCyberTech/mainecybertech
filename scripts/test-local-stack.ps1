# test-local-stack.ps1
# Test the full local stack with seed data
# Requires: Docker Desktop, Node.js, pnpm

$ErrorActionPreference = "Continue"

Write-Host "=== MCT Local Stack Test ===" -ForegroundColor Cyan

# Step 1: Check prerequisites
Write-Host "`n[1/7] Checking prerequisites..." -ForegroundColor Yellow

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Docker not found. Please install Docker Desktop." -ForegroundColor Red
    exit 1
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Node.js not found. Please install Node.js 18+." -ForegroundColor Red
    exit 1
}

if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: pnpm not found. Run: npm install -g pnpm" -ForegroundColor Red
    exit 1
}

Write-Host "  Docker: OK" -ForegroundColor Green
Write-Host "  Node.js: OK" -ForegroundColor Green
Write-Host "  pnpm: OK" -ForegroundColor Green

# Step 2: Stop any existing containers
Write-Host "`n[2/7] Cleaning up existing containers..." -ForegroundColor Yellow
docker compose down 2>&1 | Out-Null
npx supabase stop 2>&1 | Out-Null
Write-Host "  Cleanup complete" -ForegroundColor Green

# Step 3: Start Supabase
Write-Host "`n[3/7] Starting Supabase..." -ForegroundColor Yellow
npx supabase start 2>&1 | Out-Null
Write-Host "  Supabase started" -ForegroundColor Green

# Step 4: Wait for healthy
Write-Host "`n[4/7] Waiting for Supabase to be healthy..." -ForegroundColor Yellow
$maxWait = 60
$elapsed = 0
while ($elapsed -lt $maxWait) {
    $status = docker ps --format "{{.Names}}:{{.Status}}" 2>&1 | Select-String "supabase_db" | Select-Object -First 1
    if ($status -match "healthy") {
        Write-Host "  Supabase is healthy" -ForegroundColor Green
        break
    }
    Start-Sleep -Seconds 5
    $elapsed += 5
    Write-Host "  Waiting... ($elapsed/$maxWait seconds)" -ForegroundColor Gray
}
if ($elapsed -ge $maxWait) {
    Write-Host "  WARNING: Supabase may not be fully healthy" -ForegroundColor Yellow
}

# Step 5: Apply migrations and seeds
Write-Host "`n[5/7] Applying migrations and seeds..." -ForegroundColor Yellow
npx supabase db reset 2>&1 | Out-Null
Write-Host "  Migrations and seeds applied" -ForegroundColor Green

# Step 6: Sync env vars
Write-Host "`n[6/7] Syncing environment variables..." -ForegroundColor Yellow

# Get Supabase values
$envValues = npx supabase status -o env 2>&1
$anonKey = ($envValues | Select-String 'ANON_KEY="(.+?)"').Matches.Groups[1].Value
$serviceRoleKey = ($envValues | Select-String 'SERVICE_ROLE_KEY="(.+?)"').Matches.Groups[1].Value
$jwtSecret = ($envValues | Select-String 'JWT_SECRET="(.+?)"').Matches.Groups[1].Value

# Update API .env.local
$apiEnv = @"
# Environment Configuration
# Auto-generated from Supabase local instance

## API Server
NODE_ENV=development
API_PORT=4000

## Database
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=$anonKey
SUPABASE_SERVICE_ROLE_KEY=$serviceRoleKey

## Authentication
JWT_SECRET=$jwtSecret

## CORS
CORS_ORIGIN=http://localhost:3000

## Logging
LOG_LEVEL=info

## External Services (optional)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

JIRA_BASE_URL=
JIRA_EMAIL=
JIRA_API_TOKEN=

JSM_BASE_URL=
JSM_EMAIL=
JSM_API_TOKEN=

M365_TENANT_ID=
M365_CLIENT_ID=
M365_CLIENT_SECRET=

ESIGN_API_KEY=
"@
Set-Content -Path "apps/api/.env.local" -Value $apiEnv -Encoding UTF8
Copy-Item "apps/api/.env.local" "apps/api/.env" -Force

# Update Web .env.local
$webEnv = @"
NEXT_PUBLIC_API_URL=http://localhost:4000
"@
Set-Content -Path "apps/web/.env.local" -Value $webEnv -Encoding UTF8

# Update Worker .env.local
$workerEnv = @"
# Environment Configuration
# Auto-generated from Supabase local instance

## Worker Configuration
NODE_ENV=development
LOG_LEVEL=info

## Database
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=$anonKey

## Worker Specific
WORKER_CONCURRENCY=10
WORKER_TIMEOUT=30000
"@
Set-Content -Path "apps/worker/.env.local" -Value $workerEnv -Encoding UTF8

Write-Host "  Environment variables synced" -ForegroundColor Green

# Step 7: Run tests
Write-Host "`n[7/7] Running tests..." -ForegroundColor Yellow
pnpm test
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Tests failed" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== All checks passed! ===" -ForegroundColor Green
Write-Host "`nLocal stack is ready:" -ForegroundColor Cyan
Write-Host "  Supabase Studio: http://localhost:54323" -ForegroundColor White
Write-Host "  API: http://localhost:4000" -ForegroundColor White
Write-Host "  API Docs: http://localhost:4000/api/v1/docs" -ForegroundColor White
Write-Host "  Web: http://localhost:3000" -ForegroundColor White
Write-Host "`nTo start the services:" -ForegroundColor Cyan
Write-Host "  Terminal 1: pnpm --filter=api dev" -ForegroundColor White
Write-Host "  Terminal 2: pnpm --filter=web dev" -ForegroundColor White
Write-Host "  Terminal 3: pnpm --filter=worker dev" -ForegroundColor White
