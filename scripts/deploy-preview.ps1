# deploy-preview.ps1 - reemplazo MANUAL del workflow "Preview Deployment" (GitHub Actions deshabilitado).
# Uso:
#   $env:CLOUDFLARE_API_TOKEN="..."; $env:CLOUDFLARE_ACCOUNT_ID="..."; $env:NUXT_SESSION_SECRET="..."
#   .\scripts\deploy-preview.ps1 -Branch mi-rama
param(
    [Parameter(Mandatory = $true)][string]$Branch,
    [string]$Project = "plataforma-fiscal"
)
$ErrorActionPreference = "Stop"

if (-not $env:CLOUDFLARE_API_TOKEN) { throw "Falta CLOUDFLARE_API_TOKEN" }
if (-not $env:CLOUDFLARE_ACCOUNT_ID) { throw "Falta CLOUDFLARE_ACCOUNT_ID" }
if (-not $env:NUXT_SESSION_SECRET) { throw "Falta NUXT_SESSION_SECRET" }

npm ci --legacy-peer-deps
if ($LASTEXITCODE -ne 0) { throw "npm ci falló" }
npm run build
if ($LASTEXITCODE -ne 0) { throw "npm run build falló" }

npx --yes wrangler pages deploy .output/public --project-name=$Project --branch=$Branch
if ($LASTEXITCODE -ne 0) { throw "wrangler pages deploy falló" }
Write-Host "Preview deploy OK (branch=$Branch)"