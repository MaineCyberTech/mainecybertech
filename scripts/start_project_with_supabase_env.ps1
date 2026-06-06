# start_project_with_supabase_env.ps1
param(
  [switch]$UseNpx,
  [ValidateSet('nextjs', 'vite', 'generic')]
  [string]$Framework = 'nextjs',
  [string]$EnvFile = '.env.local',
  [string]$SupabaseCmd = 'supabase',
  [string]$Command = 'npm run dev'
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
& "$PSScriptRoot\sync_supabase_env.auto.v2.ps1" -UseNpx:$UseNpx -Framework $Framework -EnvFile $EnvFile -SupabaseCmd $SupabaseCmd
Write-Host "`nStarting project command: $Command" -ForegroundColor Cyan
Invoke-Expression $Command
