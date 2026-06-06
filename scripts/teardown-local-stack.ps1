# teardown-local-stack.ps1
# Stop the MCT local development stack

$ErrorActionPreference = "Continue"

Write-Host "=== MCT Local Stack Teardown ===" -ForegroundColor Cyan

# Step 1: Stop Supabase
Write-Host "`n[1/4] Stopping Supabase..." -ForegroundColor Yellow
npx supabase stop 2>&1 | Out-Null
Write-Host "  Supabase stopped" -ForegroundColor Green

# Step 2: Stop Docker Compose services
Write-Host "`n[2/4] Stopping Docker Compose services..." -ForegroundColor Yellow
docker compose down 2>&1 | Out-Null
Write-Host "  Docker Compose services stopped" -ForegroundColor Green

# Step 3: Stop PowerShell background jobs
Write-Host "`n[3/4] Stopping background jobs..." -ForegroundColor Yellow
Get-Job -ErrorAction SilentlyContinue | Stop-Job -Force -ErrorAction SilentlyContinue
Get-Job -ErrorAction SilentlyContinue | Remove-Job -Force -ErrorAction SilentlyContinue
Write-Host "  Background jobs stopped" -ForegroundColor Green

# Step 4: Find and kill API/web server processes on ports 3000 and 4000
Write-Host "`n[4/4] Stopping API and web servers..." -ForegroundColor Yellow
$ports = @(3000, 4000)
foreach ($port in $ports) {
    $connections = netstat -ano | Select-String ":$port\s" | Select-String "LISTENING"
    foreach ($conn in $connections) {
        $pid = $conn -replace '.*?(\d+)$', '$1'
        if ($pid -match '^\d+$') {
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
            Write-Host "  Stopped process $pid on port $port" -ForegroundColor Green
        }
    }
}

# Clean up temp files
Remove-Item "C:\temp\api.log" -Force 2>&1 | Out-Null
Remove-Item "C:\temp\api-error.log" -Force 2>&1 | Out-Null

Write-Host "`n=== Teardown complete ===" -ForegroundColor Green
Write-Host "All services stopped." -ForegroundColor White
