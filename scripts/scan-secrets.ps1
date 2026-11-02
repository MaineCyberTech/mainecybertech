#!/usr/bin/env pwsh
# Pre-commit secret scanner for Windows environments.
# Values match against the canonical pattern list in
# scripts/ci/secret-patterns.txt, shared with scripts/scan-secrets.sh and the CI
# action — it matches secret VALUES, not variable names (name matching blocked
# benign mentions and missed real values; audit SECRET-P2-003).
$Patterns = Get-Content (Join-Path $PSScriptRoot 'ci/secret-patterns.txt') |
    Where-Object { $_.Trim() -and -not $_.Trim().StartsWith('#') }

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