#!/usr/bin/env pwsh
<#
.SYNOPSIS
  Automated Supabase database backup script.
  Schedules daily backups with retention and uploads to S3.
.DESCRIPTION
  This script creates a pg_dump of the Supabase database,
  compresses it, uploads to S3, and cleans up old backups.
  Can be run manually or via CI workflow.
.PARAMETER BackupDir
  Local directory to store backups before upload. Default: ./backups
.PARAMETER RetentionDays
  Number of days to keep backups in S3. Default: 30
.PARAMETER S3Bucket
  S3 bucket name for backup storage. Default: mainecybertech-backups
.PARAMETER S3Prefix
  S3 key prefix. Default: database-backups
#>

param(
  [string]$BackupDir = "./backups",
  [int]$RetentionDays = 30,
  [string]$S3Bucket = "mainecybertech-backups",
  [string]$S3Prefix = "database-backups"
)

$timestamp = Get-Date -Format "yyyy-MM-dd-HHmmss"
$filename = "supabase-dump-$timestamp.sql.gz"
$localPath = Join-Path $BackupDir $filename

Write-Host "=== Maine CyberTech Database Backup ===" -ForegroundColor Cyan
Write-Host "Timestamp: $timestamp"
Write-Host ""

# Ensure backup directory exists
if (-not (Test-Path $BackupDir)) {
  New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
  Write-Host "Created backup directory: $BackupDir"
}

# Check required env vars
$required = @("SUPABASE_DB_URL", "AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY")
$missing = @()
foreach ($var in $required) {
  if (-not [Environment]::GetEnvironmentVariable($var)) {
    $missing += $var
  }
}

if ($missing.Count -gt 0) {
  Write-Host "ERROR: Missing required environment variables: $($missing -join ', ')" -ForegroundColor Red
  exit 1
}

$dbUrl = [Environment]::GetEnvironmentVariable("SUPABASE_DB_URL")

# Check for required tools
$hasPgDump = Get-Command "pg_dump" -ErrorAction SilentlyContinue
$hasAws = Get-Command "aws" -ErrorAction SilentlyContinue

if (-not $hasPgDump) {
  Write-Host "WARNING: pg_dump not found. Attempting docker fallback..." -ForegroundColor Yellow
  $useDocker = $true
}
else {
  $useDocker = $false
}

# Step 1: Dump database
Write-Host "`nStep 1: Dumping database..." -ForegroundColor Yellow

if ($useDocker) {
  docker run --rm -v "${BackupDir}:/backups" postgres:15 `
    pg_dump "$dbUrl" --no-owner | gzip > $localPath
}
else {
  & pg_dump "$dbUrl" --no-owner | & gzip > $localPath
}

if ($LASTEXITCODE -ne 0 -or -not (Test-Path $localPath)) {
  Write-Host "ERROR: Database dump failed" -ForegroundColor Red
  exit 1
}

$fileSize = (Get-Item $localPath).Length
Write-Host "Backup created: $localPath ($([math]::Round($fileSize / 1MB, 2)) MB)"

# Step 2: Upload to S3
Write-Host "`nStep 2: Uploading to S3..." -ForegroundColor Yellow

$s3Key = "$S3Prefix/$filename"
$awsResult = aws s3 cp $localPath "s3://$S3Bucket/$s3Key" --storage-class STANDARD_IA 2>&1

if ($LASTEXITCODE -ne 0) {
  Write-Host "ERROR: S3 upload failed: $awsResult" -ForegroundColor Red
  exit 1
}

Write-Host "Uploaded to s3://$S3Bucket/$s3Key"

# Step 3: Clean up local backup
Write-Host "`nStep 3: Cleaning up local backup..." -ForegroundColor Yellow
Remove-Item $localPath -Force
Write-Host "Local backup removed"

# Step 4: Clean up old S3 backups (older than retention)
Write-Host "`nStep 4: Cleaning up backups older than $RetentionDays days..." -ForegroundColor Yellow

$cutoffDate = (Get-Date).AddDays(-$RetentionDays).ToString("yyyy-MM-dd")

$oldBackups = aws s3api list-objects-v2 `
  --bucket $S3Bucket `
  --prefix "$S3Prefix/" `
  --query "Contents[?LastModified<=\`"${cutoffDate}T00:00:00Z\`"].Key" `
  --output json 2>$null | ConvertFrom-Json

if ($oldBackups -and $oldBackups.Count -gt 0) {
  $deleteObjects = @{ Objects = $oldBackups | ForEach-Object { @{ Key = $_ } } }
  $deleteJson = $deleteObjects | ConvertTo-Json -Compress

  aws s3api delete-objects --bucket $S3Bucket --delete $deleteJson | Out-Null
  Write-Host "Deleted $($oldBackups.Count) old backup(s)"
}
else {
  Write-Host "No old backups to clean up"
}

Write-Host ""
Write-Host "=== Backup Complete ===" -ForegroundColor Green
Write-Host "Database dumped, compressed, and uploaded to S3."