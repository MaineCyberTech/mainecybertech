# start-local-stack.ps1
# Start the full MCT local development stack
# Requires: Docker Desktop, Node.js 18+, pnpm, Supabase CLI

$ErrorActionPreference = "Stop"
$projectRoot = $PWD.Path

Write-Host "=== MCT Local Stack Start ===" -ForegroundColor Cyan

# Step 1: Check prerequisites
Write-Host "`n[1/8] Checking prerequisites..." -ForegroundColor Yellow

$hasDocker = Get-Command docker -ErrorAction SilentlyContinue
$hasNode = Get-Command node -ErrorAction SilentlyContinue
$hasPnpm = Get-Command pnpm -ErrorAction SilentlyContinue
$hasSupabase = Get-Command supabase -ErrorAction SilentlyContinue

if (-not $hasDocker) { Write-Host "ERROR: Docker not found. Install Docker Desktop." -ForegroundColor Red; exit 1 }
if (-not $hasNode) { Write-Host "ERROR: Node.js not found. Install Node 18+." -ForegroundColor Red; exit 1 }
if (-not $hasPnpm) { Write-Host "ERROR: pnpm not found. Install: npm install -g pnpm" -ForegroundColor Red; exit 1 }
if (-not $hasSupabase) { Write-Host "WARNING: supabase CLI not found. Install: npm install -g supabase" -ForegroundColor Yellow }

Write-Host "  Docker: OK" -ForegroundColor Green
Write-Host "  Node.js: OK" -ForegroundColor Green
Write-Host "  pnpm: OK" -ForegroundColor Green
if ($hasSupabase) { Write-Host "  Supabase CLI: OK" -ForegroundColor Green }

# Step 2: Install dependencies
Write-Host "`n[2/8] Installing dependencies..." -ForegroundColor Yellow
cmd /c "pnpm install >nul 2>&1"
if ($LASTEXITCODE -ne 0) { Write-Host "ERROR: pnpm install failed" -ForegroundColor Red; exit 1 }
Write-Host "  Dependencies installed" -ForegroundColor Green

# Step 3: Start Supabase
Write-Host "`n[3/8] Starting Supabase..." -ForegroundColor Yellow
docker compose down *>$null
cmd /c "npx supabase stop --no-backup >nul 2>&1"
cmd /c "npx supabase start >nul 2>&1"
if ($LASTEXITCODE -ne 0) { Write-Host "ERROR: Supabase failed to start" -ForegroundColor Red; exit 1 }
Write-Host "  Supabase started" -ForegroundColor Green

# Step 4: Wait for Supabase database container to be healthy
Write-Host "`n[4/8] Waiting for Supabase to be healthy..." -ForegroundColor Yellow
$maxWait = 90
$elapsed = 0
$healthy = $false
while ($elapsed -lt $maxWait) {
    $status = docker ps --format "{{.Names}}:{{.Status}}" 2>&1 | Select-String "supabase_db" | Select-Object -First 1
    if ($status -match "healthy") {
        Write-Host "  Supabase is healthy after ${elapsed}s" -ForegroundColor Green
        $healthy = $true
        break
    }
    Start-Sleep -Seconds 5
    $elapsed += 5
}
if (-not $healthy) { Write-Host "ERROR: Supabase did not become healthy" -ForegroundColor Red; exit 1 }

# Step 5: Apply migrations and seeds
Write-Host "`n[5/8] Applying migrations and seeds..." -ForegroundColor Yellow
cmd /c "npx supabase db reset >nul 2>&1"
if ($LASTEXITCODE -ne 0) { Write-Host "ERROR: Migration/seed failed" -ForegroundColor Red; exit 1 }
Write-Host "  Migrations and seeds applied" -ForegroundColor Green

# Step 6: Sync environment variables
Write-Host "`n[6/8] Syncing environment variables..." -ForegroundColor Yellow

$envValues = cmd /c "npx supabase status -o env 2>nul"
$anonKey = ($envValues | Select-String 'ANON_KEY="(.+?)"').Matches.Groups[1].Value
$serviceRoleKey = ($envValues | Select-String 'SERVICE_ROLE_KEY="(.+?)"').Matches.Groups[1].Value
$jwtSecret = ($envValues | Select-String 'JWT_SECRET="(.+?)"').Matches.Groups[1].Value

if (-not $anonKey -or -not $serviceRoleKey) {
    Write-Host "ERROR: Failed to read Supabase env vars" -ForegroundColor Red; exit 1
}

# API env
$apiEnv = @"
NODE_ENV=development
API_PORT=4000
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=$anonKey
SUPABASE_SERVICE_ROLE_KEY=$serviceRoleKey
JWT_SECRET=$jwtSecret
CORS_ORIGIN=http://localhost:3000
LOG_LEVEL=info
"@
Set-Content -Path "$projectRoot\apps\api\.env.local" -Value $apiEnv -Encoding UTF8
Copy-Item "$projectRoot\apps\api\.env.local" "$projectRoot\apps\api\.env" -Force

# Web env
Set-Content -Path "$projectRoot\apps\web\.env.local" -Value "NEXT_PUBLIC_API_URL=http://localhost:4000" -Encoding UTF8

# Worker env
$workerEnv = @"
NODE_ENV=development
LOG_LEVEL=info
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=$anonKey
WORKER_CONCURRENCY=10
WORKER_TIMEOUT=30000
HEALTH_PORT=3001
"@
Set-Content -Path "$projectRoot\apps\worker\.env.local" -Value $workerEnv -Encoding UTF8

Write-Host "  Environment variables synced" -ForegroundColor Green

# Step 7: Build API
Write-Host "`n[7/8] Building API..." -ForegroundColor Yellow
cmd /c "pnpm --filter=api build >nul 2>&1"
if ($LASTEXITCODE -ne 0) { Write-Host "ERROR: API build failed" -ForegroundColor Red; exit 1 }
Write-Host "  API built" -ForegroundColor Green

# Step 8: Start services
Write-Host "`n[8/8] Starting services..." -ForegroundColor Yellow

# Start API
Start-Job -Name "api" -ScriptBlock {
    param($root)
    Set-Location "$root\apps\api"
    node dist/main.js
} -ArgumentList $projectRoot | Out-Null
Start-Sleep -Seconds 5

# Wait for API
$maxWait = 30
$elapsed = 0
$apiReady = $false
while ($elapsed -lt $maxWait) {
    try {
        $r = Invoke-WebRequest -Uri "http://localhost:4000/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
        if ($r.StatusCode -eq 200) {
            Write-Host "  API: Ready (${elapsed}s)" -ForegroundColor Green
            $apiReady = $true
            break
        }
    } catch {}
    Start-Sleep -Seconds 2
    $elapsed += 2
}
if (-not $apiReady) { Write-Host "WARNING: API not healthy after 30s" -ForegroundColor Yellow }

# Start web
Start-Job -Name "web" -ScriptBlock {
    param($root)
    Set-Location "$root\apps\web"
    $env:NEXT_PUBLIC_API_URL = "http://localhost:4000"
    pnpm dev
} -ArgumentList $projectRoot | Out-Null

# Wait for web
$maxWait = 60
$elapsed = 0
$webReady = $false
while ($elapsed -lt $maxWait) {
    try {
        $r = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
        if ($r.StatusCode -eq 200 -or $r.StatusCode -eq 404) {
            Write-Host "  Web: Ready (${elapsed}s)" -ForegroundColor Green
            $webReady = $true
            break
        }
    } catch {}
    Start-Sleep -Seconds 3
    $elapsed += 3
}
if (-not $webReady) { Write-Host "WARNING: Web not ready after 60s" -ForegroundColor Yellow }

# Verify login works
try {
    $body = '{"email":"superadmin.real@mainecybertech.local","password":"1"}'
    $r = Invoke-WebRequest -Uri "http://localhost:4000/api/v1/auth/sign-in" -Method POST -Headers @{"Content-Type"="application/json"} -Body $body -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    $c = $r.Content | ConvertFrom-Json
    if ($c.success) { Write-Host "  Login: Verified" -ForegroundColor Green }
    else { Write-Host "WARNING: Login failed" -ForegroundColor Yellow }
} catch { Write-Host "WARNING: Login check failed" -ForegroundColor Yellow }

# Summary
Write-Host "`n=== Local Stack Ready ===" -ForegroundColor Green
Write-Host "`nServices:" -ForegroundColor Cyan
Write-Host "  Supabase Studio: http://localhost:54323" -ForegroundColor White
Write-Host "  API:             http://localhost:4000" -ForegroundColor White
Write-Host "  API Docs:        http://localhost:4000/api/v1/docs" -ForegroundColor White
Write-Host "  Web:             http://localhost:3000" -ForegroundColor White

Write-Host "`nSeed users (password: 1):" -ForegroundColor Cyan
@(
    "superadmin.real@mainecybertech.local",
    "mspadmin.real@mainecybertech.local",
    "clientadmin.real@acme.example",
    "technician.real@acme.example",
    "user.real@acme.example",
    "clientadmin.real@beta.example",
    "user.real@beta.example"
) | ForEach-Object { Write-Host "  $_" -ForegroundColor White }

Write-Host "`nTo stop: ./scripts/teardown-local-stack.ps1" -ForegroundColor Yellow
Write-Host "To run E2E tests: cd apps/web; npx playwright test" -ForegroundColor Yellow
