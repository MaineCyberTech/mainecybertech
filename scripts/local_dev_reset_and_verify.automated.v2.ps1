# local_dev_reset_and_verify.automated.v2.ps1
param(
  [switch]$UseNpx,
  [string]$SupabaseCmd = 'supabase'
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

function Write-Section { param([string]$Message) Write-Host "`n=== $Message ===" -ForegroundColor Cyan }
function Invoke-Supabase { param([string[]]$CliArgs) if ($UseNpx) { & npx $SupabaseCmd @CliArgs } else { & $SupabaseCmd @CliArgs } }
function Invoke-SupabaseQueryFile { param([string]$FilePath) if ($UseNpx) { Get-Content -LiteralPath $FilePath | & npx $SupabaseCmd db query } else { Get-Content -LiteralPath $FilePath | & $SupabaseCmd db query } }

if (-not (Test-Path -LiteralPath 'supabase')) { throw 'Expected supabase/ folder not found.' }
if (-not (Test-Path -LiteralPath 'sql/verify_local_dev_extended.single.sql')) { throw 'Expected sql/verify_local_dev_extended.single.sql not found.' }

Write-Section 'Pre-flight CLI check'
if ($UseNpx) { & npx $SupabaseCmd '--help' | Out-Null; Write-Host 'Using Supabase CLI via npx.' -ForegroundColor Green }
else { & $SupabaseCmd '--help' | Out-Null; Write-Host 'Using Supabase CLI from PATH.' -ForegroundColor Green }

Write-Section 'Start local Supabase stack'
Invoke-Supabase -CliArgs @('start')

Write-Section 'Reset local database (ordered seed files run automatically)'
Invoke-Supabase -CliArgs @('db', 'reset')

Write-Section 'Run extended verification (single statement)'
Invoke-SupabaseQueryFile -FilePath 'sql/verify_local_dev_extended.single.sql'

Write-Section 'Complete'
Write-Host 'Automated local dev reset + verify complete.' -ForegroundColor Green
