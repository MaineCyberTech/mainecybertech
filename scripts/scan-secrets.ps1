#!/usr/bin/env pwsh
# Pre-commit secret scanner for Windows environments
$Patterns = @(
    'SUPABASE_SERVICE_ROLE_KEY'
    'SUPABASE_ANON_KEY'
    'JWT_SECRET'
    'STRIPE_SECRET_KEY'
    'AKIA[0-9A-Z]{16}'
    'ghp_[0-9a-zA-Z]{36}'
    '-----BEGIN[ A-Za-z]*PRIVATE KEY-----'
)

$Staged = git diff --cached --diff-filter=ACMR --name-only 2>$null
if (-not $Staged) { exit 0 }

$Matches = 0
foreach ($file in $Staged) {
    if ($file -match '\.md$' -or $file -match 'scan-secrets') { continue }
    $diff = git diff --cached -U0 -- $file 2>$null
    foreach ($pattern in $Patterns) {
        if ($diff -match $pattern) {
            Write-Host "  SECRET PATTERN DETECTED in $file': $pattern"
            $Matches++
        }
    }
}

if ($Matches -gt 0) {
    Write-Host ""
    Write-Host "  Commit blocked. Remove or replace secret values before committing."
    exit 1
}
exit 0