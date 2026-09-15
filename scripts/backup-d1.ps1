# backup-d1.ps1 - reemplazo MANUAL del workflow "Database Backup" (GitHub Actions deshabilitado).
# Uso:
#   $env:CLOUDFLARE_API_TOKEN="..."; $env:CLOUDFLARE_ACCOUNT_ID="..."
#   .\scripts\backup-d1.ps1
param(
    [string]$Database = "fiscal_platform_db",
    [string]$OutputDir = ".\backups",
    [switch]$UploadToR2,
    [string]$Bucket = "backups"
)
$ErrorActionPreference = "Stop"

if (-not $env:CLOUDFLARE_API_TOKEN) { throw "Falta CLOUDFLARE_API_TOKEN" }
if (-not $env:CLOUDFLARE_ACCOUNT_ID) { throw "Falta CLOUDFLARE_ACCOUNT_ID" }

New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
$date = (Get-Date).ToUniversalTime().ToString("yyyy-MM-dd")
$out = Join-Path $OutputDir "backup-$date.sql"

Write-Host "Exportando $Database -> $out"
npx --yes wrangler d1 export $Database --remote --output $out
if ($LASTEXITCODE -ne 0) { throw "wrangler d1 export falló" }

if ($UploadToR2) {
    npx --yes wrangler r2 object put "$Bucket/backup-$date.sql" --file $out
    if ($LASTEXITCODE -ne 0) { throw "wrangler r2 object put falló" }
}

Write-Host "Backup OK: $out"