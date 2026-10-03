#!/usr/bin/env pwsh
# Pre-commit secret scanner for Windows environments.
# Keep the pattern list in sync with scripts/scan-secrets.sh — it matches secret
# VALUES, not variable names (name matching blocked benign mentions and missed
# real values; audit SECRET-P2-003).
$Patterns = @(
    'AKIA[0-9A-Z]{16}'
    'ASIA[0-9A-Z]{16}'
    'ghp_[0-9a-zA-Z]{36}'
    'gho_[0-9a-zA-Z]{36}'
    'ghu_[0-9a-zA-Z]{36}'
    'github_pat_[0-9a-zA-Z_]{22,}'
    'sk_(live|test)_[0-9a-zA-Z]{16,}'
    'xox[baprs]-[0-9a-zA-Z-]{10,}'
    '-----BEGIN[ A-Za-z]*PRIVATE KEY-----'
    'eyJhbGciOi[A-Za-z0-9_-]{10,}\.[A-Za-z0-9._-]{20,}\.[A-Za-z0-9._-]{20,}'
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