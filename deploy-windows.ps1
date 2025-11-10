# ============================================
# DEPLOY SCRIPT PARA WINDOWS POWERSHELL
# ============================================
#
# Instrucciones: Copia y pega cada bloque en tu PowerShell
# Ubicación: C:\Dev\Zo\sass_account
#
# ============================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DEPLOYMENT A CLOUDFLARE - PASO A PASO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ============================================
# PASO 1: Instalar Wrangler CLI
# ============================================

Write-Host "PASO 1/6: Instalando Wrangler CLI..." -ForegroundColor Yellow
Write-Host ""

npm install -g wrangler

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Wrangler instalado correctamente" -ForegroundColor Green
    wrangler --version
} else {
    Write-Host "❌ Error instalando Wrangler" -ForegroundColor Red
    Write-Host "Intenta ejecutar PowerShell como Administrador" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Read-Host "Presiona Enter para continuar al Paso 2"

# ============================================
# PASO 2: Login a Cloudflare
# ============================================

Write-Host ""
Write-Host "PASO 2/6: Autenticándote en Cloudflare..." -ForegroundColor Yellow
Write-Host "Se abrirá tu navegador. Autoriza el acceso." -ForegroundColor Cyan
Write-Host ""

wrangler login

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Autenticado correctamente" -ForegroundColor Green
} else {
    Write-Host "❌ Error en la autenticación" -ForegroundColor Red
    exit 1
}

Write-Host ""
Read-Host "Presiona Enter para continuar al Paso 3"

# ============================================
# PASO 3: Crear Database D1
# ============================================

Write-Host ""
Write-Host "PASO 3/6: Creando Database D1..." -ForegroundColor Yellow
Write-Host ""

$output = wrangler d1 create fiscal_platform_db 2>&1 | Out-String

Write-Host $output

# Extraer database_id del output
if ($output -match 'database_id = "([^"]+)"') {
    $databaseId = $matches[1]
    Write-Host ""
    Write-Host "✅ Database creada exitosamente" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 Database ID: $databaseId" -ForegroundColor Cyan
    Write-Host ""

    # Actualizar wrangler.toml automáticamente
    Write-Host "Actualizando wrangler.toml..." -ForegroundColor Yellow

    $wranglerToml = Get-Content "wrangler.toml" -Raw
    $wranglerToml = $wranglerToml -replace 'database_id = "your-database-id"', "database_id = `"$databaseId`""
    Set-Content "wrangler.toml" -Value $wranglerToml

    Write-Host "✅ wrangler.toml actualizado con el database_id" -ForegroundColor Green
} else {
    Write-Host "❌ No se pudo extraer el database_id" -ForegroundColor Red
    Write-Host "Por favor, cópialo manualmente del output anterior" -ForegroundColor Yellow
    $databaseId = Read-Host "Pega el database_id aquí"

    # Actualizar wrangler.toml manualmente
    $wranglerToml = Get-Content "wrangler.toml" -Raw
    $wranglerToml = $wranglerToml -replace 'database_id = "your-database-id"', "database_id = `"$databaseId`""
    Set-Content "wrangler.toml" -Value $wranglerToml
}

Write-Host ""
Read-Host "Presiona Enter para continuar al Paso 4"

# ============================================
# PASO 4: Aplicar Migraciones a D1
# ============================================

Write-Host ""
Write-Host "PASO 4/6: Aplicando schema a la base de datos..." -ForegroundColor Yellow
Write-Host ""

wrangler d1 migrations apply fiscal_platform_db --remote

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Migraciones aplicadas correctamente" -ForegroundColor Green
} else {
    Write-Host "❌ Error aplicando migraciones" -ForegroundColor Red
    exit 1
}

Write-Host ""
Read-Host "Presiona Enter para continuar al Paso 5"

# ============================================
# PASO 5: Deploy a Cloudflare Pages
# ============================================

Write-Host ""
Write-Host "PASO 5/6: Deploying a Cloudflare Pages..." -ForegroundColor Yellow
Write-Host "Esto puede tomar 1-2 minutos..." -ForegroundColor Cyan
Write-Host ""

wrangler pages deploy .output/public --project-name=plataforma-fiscal

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Deploy completado exitosamente" -ForegroundColor Green
} else {
    Write-Host "❌ Error en el deploy" -ForegroundColor Red
    exit 1
}

Write-Host ""
Read-Host "Presiona Enter para continuar al Paso 6"

# ============================================
# PASO 6: Generar Variables de Entorno
# ============================================

Write-Host ""
Write-Host "PASO 6/6: Generando variables de entorno..." -ForegroundColor Yellow
Write-Host ""

# Generar session secret
$bytes = New-Object byte[] 32
[Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes($bytes)
$sessionSecret = [Convert]::ToBase64String($bytes)

Write-Host "✅ Variables generadas" -ForegroundColor Green
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "CONFIGURAR EN CLOUDFLARE DASHBOARD" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Ve a: https://dash.cloudflare.com" -ForegroundColor White
Write-Host "2. Pages > plataforma-fiscal > Settings > Environment variables" -ForegroundColor White
Write-Host ""
Write-Host "3. Agrega estas 2 variables:" -ForegroundColor White
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""
Write-Host "Variable 1:" -ForegroundColor Green
Write-Host "  Name: NUXT_SESSION_SECRET"
Write-Host "  Value: $sessionSecret" -ForegroundColor Yellow
Write-Host "  Environment: Production"
Write-Host ""
Write-Host "Variable 2:" -ForegroundColor Green
Write-Host "  Name: DATABASE_ID"
Write-Host "  Value: $databaseId" -ForegroundColor Yellow
Write-Host "  Environment: Production"
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Save las variables" -ForegroundColor White
Write-Host "5. Deployments > Retry deployment" -ForegroundColor White
Write-Host ""

# Guardar en archivo para referencia
@"
# Variables de Entorno para Cloudflare Pages
# Configúralas en: Dashboard > Settings > Environment variables

NUXT_SESSION_SECRET=$sessionSecret
DATABASE_ID=$databaseId

# Instrucciones:
# 1. Ve a: https://dash.cloudflare.com
# 2. Pages > plataforma-fiscal > Settings > Environment variables
# 3. Agrega las variables de arriba
# 4. Save y Retry deployment
"@ | Out-File -FilePath ".env.cloudflare" -Encoding UTF8

Write-Host "✅ Variables guardadas en .env.cloudflare para referencia" -ForegroundColor Green
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🎉 DEPLOYMENT COMPLETADO" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Tu app estará disponible en:" -ForegroundColor White
Write-Host "https://plataforma-fiscal.pages.dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "💰 Costo: `$0/mes (tier gratuito)" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  IMPORTANTE: Configura las variables de entorno" -ForegroundColor Yellow
Write-Host "   antes de usar la aplicación." -ForegroundColor Yellow
Write-Host ""
