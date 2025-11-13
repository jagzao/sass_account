# 🔐 GitHub Secrets Setup - Guía Rápida

Esta guía te ayudará a configurar los secrets de GitHub para deployments automáticos con GitHub Actions.

---

## 📋 Pre-requisitos

1. Cuenta de Cloudflare (gratis)
2. Repositorio de GitHub
3. Proyecto creado en Cloudflare Pages
4. Base de datos D1 creada

---

## 🚀 Paso 1: Obtener Cloudflare API Token

### 1.1 Crear API Token

1. Ve a [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Click en tu perfil (esquina superior derecha)
3. **My Profile** > **API Tokens**
4. **Create Token**
5. Selecciona **Edit Cloudflare Workers** template
6. **Continue to summary**
7. **Create Token**
8. **Copia el token** (solo se muestra una vez) ⚠️

### 1.2 Obtener Account ID

1. En [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Click en **Workers & Pages** (sidebar)
3. En la columna derecha verás **Account ID**
4. Copia el Account ID

### 1.3 Obtener Database ID

```bash
# En tu terminal
wrangler d1 list

# Copia el ID de tu base de datos "fiscal_platform_db"
```

---

## 🔑 Paso 2: Configurar GitHub Secrets

### 2.1 Ir a Settings de tu Repositorio

1. Abre tu repositorio en GitHub
2. Click en **Settings** (tab superior)
3. En sidebar: **Secrets and variables** > **Actions**
4. Click en **New repository secret**

### 2.2 Agregar Secrets Uno por Uno

#### Secret 1: CLOUDFLARE_API_TOKEN
```
Name: CLOUDFLARE_API_TOKEN
Secret: (pega el API token de Cloudflare)
```

#### Secret 2: CLOUDFLARE_ACCOUNT_ID
```
Name: CLOUDFLARE_ACCOUNT_ID
Secret: (pega tu Account ID)
```

#### Secret 3: NUXT_SESSION_SECRET
```bash
# Primero genera un secret seguro en tu terminal:
openssl rand -base64 32

# Luego crea el secret en GitHub:
Name: NUXT_SESSION_SECRET
Secret: (pega el resultado del comando)
```

#### Secret 4: DATABASE_ID
```
Name: DATABASE_ID
Secret: (pega el ID de tu base de datos D1)
```

#### Secret 5: NUXT_PUBLIC_RP_ID
```
Name: NUXT_PUBLIC_RP_ID
Secret: tu-proyecto.pages.dev
```
⚠️ **Sin** `https://` y **sin** trailing slash

#### Secret 6: NUXT_PUBLIC_RP_NAME
```
Name: NUXT_PUBLIC_RP_NAME
Secret: Plataforma Fiscal
```

#### Secret 7: NUXT_PUBLIC_RP_ORIGIN
```
Name: NUXT_PUBLIC_RP_ORIGIN
Secret: https://tu-proyecto.pages.dev
```
⚠️ **Con** `https://` y **sin** trailing slash

#### Secret 8: EMAIL_SERVICE
```
Name: EMAIL_SERVICE
Secret: mailchannels
```

#### Secret 9: EMAIL_FROM
```
Name: EMAIL_FROM
Secret: noreply@tu-proyecto.pages.dev
```

#### Secret 10: EMAIL_FROM_NAME
```
Name: EMAIL_FROM_NAME
Secret: Plataforma Fiscal
```

### 2.3 Secrets Opcionales

#### Sentry (Recomendado para producción)
```
Name: NUXT_PUBLIC_SENTRY_DSN
Secret: https://[KEY]@[ORG].ingest.sentry.io/[PROJECT]
```

Obtén tu DSN en: https://sentry.io/settings/projects/

---

## ✅ Paso 3: Verificar Configuración

### 3.1 Revisar Lista de Secrets

Deberías tener estos secrets configurados:

- ✅ CLOUDFLARE_API_TOKEN
- ✅ CLOUDFLARE_ACCOUNT_ID
- ✅ NUXT_SESSION_SECRET
- ✅ DATABASE_ID
- ✅ NUXT_PUBLIC_RP_ID
- ✅ NUXT_PUBLIC_RP_NAME
- ✅ NUXT_PUBLIC_RP_ORIGIN
- ✅ EMAIL_SERVICE
- ✅ EMAIL_FROM
- ✅ EMAIL_FROM_NAME
- ⚪ NUXT_PUBLIC_SENTRY_DSN (opcional)

### 3.2 Verificar Workflow File

Tu repositorio debe tener el archivo `.github/workflows/deploy.yml`:

```bash
# Verifica que existe
ls -la .github/workflows/
```

Si no existe, créalo (ver sección siguiente).

---

## 🔧 Paso 4: Crear GitHub Workflow (si no existe)

Si el archivo `.github/workflows/deploy.yml` no existe, créalo:

```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      deployments: write
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm install --legacy-peer-deps

      - name: Build
        run: npm run build
        env:
          NUXT_SESSION_SECRET: ${{ secrets.NUXT_SESSION_SECRET }}
          DATABASE_ID: ${{ secrets.DATABASE_ID }}
          NUXT_PUBLIC_RP_ID: ${{ secrets.NUXT_PUBLIC_RP_ID }}
          NUXT_PUBLIC_RP_NAME: ${{ secrets.NUXT_PUBLIC_RP_NAME }}
          NUXT_PUBLIC_RP_ORIGIN: ${{ secrets.NUXT_PUBLIC_RP_ORIGIN }}
          EMAIL_SERVICE: ${{ secrets.EMAIL_SERVICE }}
          EMAIL_FROM: ${{ secrets.EMAIL_FROM }}
          EMAIL_FROM_NAME: ${{ secrets.EMAIL_FROM_NAME }}
          NUXT_PUBLIC_SENTRY_DSN: ${{ secrets.NUXT_PUBLIC_SENTRY_DSN }}

      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: tu-proyecto-name
          directory: .output/public
```

⚠️ Reemplaza `tu-proyecto-name` con el nombre de tu proyecto en Cloudflare Pages.

---

## 🚀 Paso 5: Probar el Deployment

### 5.1 Hacer un Commit de Prueba

```bash
# Crear un cambio pequeño
echo "# Test" >> README.md

# Commit y push
git add .
git commit -m "test: verificar GitHub Actions"
git push origin main
```

### 5.2 Verificar Ejecución

1. Ve a tu repositorio en GitHub
2. Click en **Actions** (tab superior)
3. Deberías ver tu workflow ejecutándose
4. Click en el workflow para ver los detalles

### 5.3 Verificar Deployment

1. Espera a que el workflow termine (icono verde ✅)
2. Ve a [Cloudflare Dashboard](https://dash.cloudflare.com/)
3. **Workers & Pages** > Tu proyecto
4. Deberías ver un nuevo deployment
5. Click en el link para verificar que funciona

---

## 🐛 Troubleshooting

### Error: "Invalid API token"

**Causa:** El API token está mal o expiró.

**Solución:**
1. Genera un nuevo API token en Cloudflare
2. Actualiza el secret `CLOUDFLARE_API_TOKEN` en GitHub

### Error: "Project not found"

**Causa:** El nombre del proyecto no coincide.

**Solución:**
1. Verifica el nombre del proyecto en Cloudflare Pages
2. Actualiza `projectName` en `.github/workflows/deploy.yml`

### Error: "Database not found"

**Causa:** El `DATABASE_ID` está incorrecto.

**Solución:**
```bash
# Verifica el ID correcto
wrangler d1 list

# Actualiza el secret DATABASE_ID en GitHub
```

### Workflow no se ejecuta

**Causa:** El workflow file está mal ubicado o tiene errores de sintaxis.

**Solución:**
1. Verifica que esté en `.github/workflows/deploy.yml`
2. Verifica la sintaxis YAML (indentación correcta)
3. Verifica que el branch sea `main` (o el que uses)

---

## 📝 Checklist Final

Antes de hacer push:

- [ ] Todos los secrets están configurados en GitHub
- [ ] El archivo `.github/workflows/deploy.yml` existe
- [ ] El nombre del proyecto coincide con Cloudflare Pages
- [ ] La base de datos D1 está creada y vinculada
- [ ] Las migraciones están aplicadas (`wrangler d1 migrations apply`)
- [ ] El `RP_ORIGIN` tiene `https://` y sin trailing `/`
- [ ] El `RP_ID` NO tiene `https://` y sin trailing `/`

---

## 🎊 ¡Listo!

Ahora cada push a `main` hará deployment automático a Cloudflare Pages.

### Próximos pasos:

1. Agregar un branch `staging` para ambiente de pruebas
2. Configurar Sentry para monitoreo de errores
3. Agregar tests automáticos en el workflow
4. Configurar notificaciones de Slack/Discord para deployments

---

## 📚 Recursos

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Cloudflare Pages GitHub Action](https://github.com/cloudflare/pages-action)
- [Cloudflare API Tokens](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/)

---

**Última actualización:** 2025-11-13
**Versión:** 1.0.0
