# sync_supabase_env.auto.v2.ps1
# Pull local Supabase values from `supabase status -o env` and write them to an env file
# using UTF-8 WITHOUT BOM so env parsers do not fail on Windows.
param(
  [switch]$UseNpx,
  [ValidateSet('nextjs', 'vite', 'generic')]
  [string]$Framework = 'nextjs',
  [string]$EnvFile = '.env.local',
  [string]$SupabaseCmd = 'supabase'
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

function Invoke-SupabaseStatusEnv {
  if ($UseNpx) { & npx $SupabaseCmd status -o env } else { & $SupabaseCmd status -o env }
}

function Parse-EnvOutput {
  param([string[]]$Lines)
  $map = @{}
  foreach ($line in $Lines) {
    if ([string]::IsNullOrWhiteSpace($line)) { continue }
    if ($line -notmatch '=') { continue }
    $parts = $line -split '=', 2
    $key = $parts[0].Trim()
    $value = $parts[1].Trim()
    if ($value.StartsWith('"') -and $value.EndsWith('"')) {
      $value = $value.Substring(1, $value.Length - 2)
    }
    $map[$key] = $value
  }
  return $map
}

function Get-PublicVarNames {
  param([string]$FrameworkName)
  switch ($FrameworkName) {
    'nextjs' { return @{} }
    'vite'   { return @{ Url = 'VITE_SUPABASE_URL'; Key = 'VITE_SUPABASE_ANON_KEY' } }
    default  { return @{ Url = 'SUPABASE_URL'; Key = 'SUPABASE_ANON_KEY' } }
  }
}

if (-not (Test-Path -LiteralPath 'supabase')) {
  throw 'Expected supabase/ folder not found. Run this from the repo root.'
}

try {
  $raw = Invoke-SupabaseStatusEnv
} catch {
  if ($UseNpx) {
    throw 'Could not run `npx supabase status -o env`. Confirm local Supabase is running and this command works manually.'
  } else {
    throw 'Could not run `supabase status -o env`. Either install the CLI on PATH or rerun with -UseNpx.'
  }
}

$envMap = Parse-EnvOutput -Lines $raw
$publicVars = Get-PublicVarNames -FrameworkName $Framework

$apiUrl = $envMap['API_URL']
if (-not $apiUrl) { $apiUrl = $envMap['PROJECT_URL'] }
$anonKey = $envMap['ANON_KEY']
$serviceRoleKey = $envMap['SERVICE_ROLE_KEY']
$dbUrl = $envMap['DB_URL']
$jwtSecret = $envMap['JWT_SECRET']
$graphqlUrl = $envMap['GRAPHQL_URL']
$studioUrl = $envMap['STUDIO_URL']
$inbucketUrl = $envMap['INBUCKET_URL']

if (-not $apiUrl -or -not $anonKey) {
  throw 'Missing API_URL / ANON_KEY from `supabase status -o env`. Make sure local Supabase is running.'
}

$lines = @(
  '# >>> SUPABASE LOCAL AUTO-GENERATED START',
  '# Generated from `supabase status -o env`'
)
if ($publicVars.Count -gt 0) {
  $lines += "$($publicVars.Url)=$apiUrl"
  $lines += "$($publicVars.Key)=$anonKey"
}
$lines += "SUPABASE_URL=$apiUrl"
$lines += "SUPABASE_ANON_KEY=$anonKey"
if ($serviceRoleKey) { $lines += "SUPABASE_SERVICE_ROLE_KEY=$serviceRoleKey" }
if ($dbUrl) { $lines += "SUPABASE_DB_URL=$dbUrl" }
if ($jwtSecret) { $lines += "SUPABASE_JWT_SECRET=$jwtSecret" }
if ($graphqlUrl) { $lines += "SUPABASE_GRAPHQL_URL=$graphqlUrl" }
if ($studioUrl) { $lines += "SUPABASE_STUDIO_URL=$studioUrl" }
if ($inbucketUrl) { $lines += "SUPABASE_INBUCKET_URL=$inbucketUrl" }
$lines += '# <<< SUPABASE LOCAL AUTO-GENERATED END'
$newBlock = ($lines -join [Environment]::NewLine)

$existing = ''
if (Test-Path -LiteralPath $EnvFile) {
  $existing = Get-Content -LiteralPath $EnvFile -Raw
}

$pattern = '(?ms)^# >>> SUPABASE LOCAL AUTO-GENERATED START?
.*?^# <<< SUPABASE LOCAL AUTO-GENERATED END?
?'
if ($existing -match $pattern) {
  $updated = [regex]::Replace($existing, $pattern, $newBlock + [Environment]::NewLine)
} elseif ([string]::IsNullOrWhiteSpace($existing)) {
  $updated = $newBlock + [Environment]::NewLine
} else {
  $updated = $existing.TrimEnd() + [Environment]::NewLine + [Environment]::NewLine + $newBlock + [Environment]::NewLine
}

# Critical fix: remove a leading BOM if present, then write UTF-8 without BOM.
$updated = $updated.TrimStart([char]0xFEFF)
$targetPath = if (Test-Path -LiteralPath $EnvFile) { Resolve-Path -LiteralPath $EnvFile } else { Join-Path (Get-Location) $EnvFile }
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($targetPath, $updated, $utf8NoBom)

Write-Host "Updated $EnvFile with local Supabase variables (UTF-8 no BOM)." -ForegroundColor Green
