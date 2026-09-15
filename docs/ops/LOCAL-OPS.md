# Local Ops - sass_account

GitHub Actions esta DESHABILITADO (politica de costo cero). Estas eran las dos funciones que
corrian en Actions y ahora se ejecutan LOCALMENTE, a mano.

## 1) Backup diario de la base D1 (antes: cron-backup.yml, schedule 02:00 UTC)

```powershell
$env:CLOUDFLARE_API_TOKEN="..."; $env:CLOUDFLARE_ACCOUNT_ID="..."
.\scripts\backup-d1.ps1 -UploadToR2
```

Equivale a: `wrangler d1 export fiscal_platform_db --remote --output backup-YYYY-MM-DD.sql`
(+ subida a R2). Recomendacion: programar el script con el Programador de Tareas de Windows si
se quiere la cuota diaria, o correrlo manualmente antes de cambios importantes.

## 2) Preview deployment (antes: preview.yml, on pull_request)

```powershell
$env:CLOUDFLARE_API_TOKEN="..."; $env:CLOUDFLARE_ACCOUNT_ID="..."; $env:NUXT_SESSION_SECRET="..."
.\scripts\deploy-preview.ps1 -Branch mi-rama
```

## Quality local

```bash
npm ci --legacy-peer-deps
npm run build
```

## Politica
GitHub Actions: DISABLED. No agregar .github/workflows. Todo gate corre local.