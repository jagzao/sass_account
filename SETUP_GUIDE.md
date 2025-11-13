# 🚀 Guía Completa de Setup y Deployment

Esta guía te llevará paso a paso desde la instalación local hasta el deployment en producción en Cloudflare Pages.

---

## 📋 Tabla de Contenidos

1. [Requisitos Previos](#requisitos-previos)
2. [Setup Local](#setup-local)
3. [Configuración de Base de Datos](#configuración-de-base-de-datos)
4. [Configuración de Cloudflare](#configuración-de-cloudflare)
5. [Variables de Entorno](#variables-de-entorno)
6. [Deployment a Producción](#deployment-a-producción)
7. [Post-Deployment](#post-deployment)
8. [GitHub Actions (CI/CD)](#github-actions-cicd)
9. [Troubleshooting](#troubleshooting)

---

## 📦 Requisitos Previos

### Software Necesario

- **Node.js** 18+ ([descargar](https://nodejs.org/))
- **npm** 9+ (viene con Node.js)
- **Git** ([descargar](https://git-scm.com/))
- **Cuenta de Cloudflare** (gratis) - [crear cuenta](https://dash.cloudflare.com/sign-up)
- **Cuenta de GitHub** (opcional, para CI/CD)

### Verificar Instalación

```bash
node --version   # debe ser >= 18
npm --version    # debe ser >= 9
git --version
```

---

## 🛠️ Setup Local

### 1. Clonar el Repositorio

```bash
git clone <tu-repositorio>
cd plataforma-fiscal-colaborativa
```

### 2. Instalar Dependencias

```bash
npm install --legacy-peer-deps
```

> **Nota:** Usamos `--legacy-peer-deps` por compatibilidad con algunas dependencias.

### 3. Configurar Variables de Entorno

```bash
# Copiar el archivo de ejemplo
cp .env.example .env

# Generar un secret seguro
openssl rand -base64 32
```

Edita `.env` y actualiza:

```bash
# Pega el secret generado
NUXT_SESSION_SECRET=tu-secret-generado-aqui

# Mantén los valores por defecto para desarrollo local
NUXT_PUBLIC_RP_ID=localhost
NUXT_PUBLIC_RP_NAME=Plataforma Fiscal
NUXT_PUBLIC_RP_ORIGIN=http://localhost:3000
```

### 4. Inicializar Base de Datos Local

```bash
# Crear la base de datos SQLite local
npm run db:generate
npm run db:migrate
```

### 5. Ejecutar en Desarrollo

```bash
npm run dev
```

Abre tu navegador en [http://localhost:3000](http://localhost:3000)

---

## 🗄️ Configuración de Base de Datos

### Desarrollo Local

La base de datos local usa SQLite y se crea automáticamente en `./local.db`.

### Producción (Cloudflare D1)

#### 1. Instalar Wrangler CLI

```bash
npm install -g wrangler
```

#### 2. Autenticarse con Cloudflare

```bash
wrangler login
```

#### 3. Crear Base de Datos D1

```bash
# Crear la base de datos
wrangler d1 create fiscal_platform_db

# Guarda el DATABASE_ID que te devuelve
# Ejemplo: database_id = "abc123-def456-ghi789"
```

#### 4. Aplicar Migraciones

```bash
# Listar bases de datos
wrangler d1 list

# Aplicar migraciones a producción
wrangler d1 migrations apply fiscal_platform_db --remote
```

---

## ☁️ Configuración de Cloudflare

### 1. Crear Proyecto en Cloudflare Pages

1. Ve a [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. **Workers & Pages** > **Create application** > **Pages**
3. **Connect to Git** (conecta tu repo de GitHub)
4. Configuración del build:
   - **Framework preset:** Nuxt.js
   - **Build command:** `npm run build`
   - **Build output directory:** `.output/public`

### 2. Obtener Credenciales

#### Account ID

1. **Dashboard** > **Workers & Pages**
2. En la barra lateral derecha verás tu **Account ID**
3. Copia y guarda este ID

#### API Token

1. **Dashboard** > **My Profile** > **API Tokens**
2. **Create Token** > **Edit Cloudflare Workers**
3. Configura los permisos:
   - Account > Workers Scripts > Edit
   - Account > Pages > Edit
   - Account > D1 > Edit
4. **Continue to summary** > **Create Token**
5. **Copia el token** (solo se muestra una vez)

---

## 🔐 Variables de Entorno

### Variables Requeridas en Producción

Ve a tu proyecto en Cloudflare Pages: **Settings** > **Environment variables** > **Production**

Agrega las siguientes variables:

#### Esenciales

```bash
# Session Secret (usa el generado con openssl rand -base64 32)
NUXT_SESSION_SECRET=tu-secret-super-seguro-de-32-caracteres-minimo

# D1 Database ID (de wrangler d1 create)
DATABASE_ID=tu-database-id-de-cloudflare-d1
```

#### WebAuthn / 2FA (REQUERIDO)

```bash
# Tu dominio de Cloudflare Pages (sin https://)
NUXT_PUBLIC_RP_ID=tu-proyecto.pages.dev

# Nombre visible para el usuario
NUXT_PUBLIC_RP_NAME=Plataforma Fiscal

# URL completa de tu aplicación
NUXT_PUBLIC_RP_ORIGIN=https://tu-proyecto.pages.dev
```

#### Email Service (REQUERIDO para notificaciones)

```bash
# MailChannels (GRATIS en Cloudflare Workers - RECOMENDADO)
EMAIL_SERVICE=mailchannels
EMAIL_FROM=noreply@tu-proyecto.pages.dev
EMAIL_FROM_NAME=Plataforma Fiscal
```

> **Nota MailChannels:** No requiere API key cuando se usa desde Cloudflare Workers. Es completamente gratis.

#### Opcionales

```bash
# Sentry (error monitoring - gratis hasta 10k eventos/mes)
NUXT_PUBLIC_SENTRY_DSN=https://[KEY]@[ORG].ingest.sentry.io/[PROJECT]

# SendGrid (alternativa a MailChannels)
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=tu-api-key

# Postmark (alternativa a MailChannels)
EMAIL_SERVICE=postmark
POSTMARK_API_KEY=tu-api-key
```

### Vincular D1 Database

En **Settings** > **Functions** > **D1 database bindings**:

1. **Add binding**
2. **Variable name:** `DB`
3. **D1 database:** Selecciona `fiscal_platform_db`
4. **Save**

---

## 🚀 Deployment a Producción

### Opción 1: Deploy Automático (GitHub)

1. **Push a tu repositorio de GitHub:**

```bash
git add .
git commit -m "Initial setup"
git push origin main
```

2. Cloudflare Pages detectará el push y hará deploy automáticamente
3. Verás el progreso en **Deployments**

### Opción 2: Deploy Manual

```bash
# Build local
npm run build

# Deploy con Wrangler
npm run pages:deploy

# O directamente
npx wrangler pages deploy .output/public --project-name=tu-proyecto
```

### Verificar Deployment

1. Ve a **Deployments** en Cloudflare Pages
2. Espera a que el status sea **Success**
3. Haz clic en el link de tu sitio (ej: `tu-proyecto.pages.dev`)

---

## ✅ Post-Deployment

### Checklist de Verificación

- [ ] Sitio carga correctamente
- [ ] Registro de usuario funciona
- [ ] Login funciona
- [ ] Dashboard carga
- [ ] PWA instalable (ícono en barra de navegación)
- [ ] 2FA funciona (si tienes YubiKey/Touch ID)
- [ ] Emails se envían (revisar logs)

### Comandos Útiles

```bash
# Ver logs en tiempo real
wrangler pages deployment tail

# Listar deployments
wrangler pages deployment list

# Ver bases de datos
wrangler d1 list

# Query a la base de datos
wrangler d1 execute fiscal_platform_db --remote --command "SELECT * FROM usuarios LIMIT 5"

# Ver bindings
wrangler pages project list
```

### Aplicar Migración de 2FA y Audit Logs

```bash
# IMPORTANTE: Aplica esta migración después del primer deployment
wrangler d1 migrations apply fiscal_platform_db --remote
```

Esto crea las tablas:
- `audit_logs` - Registro de actividad
- `authenticators` - Dispositivos 2FA

---

## 🔄 GitHub Actions (CI/CD)

### Setup de Secrets

Para deployments automáticos, configura estos secrets en GitHub:

**Repositorio** > **Settings** > **Secrets and variables** > **Actions** > **New repository secret**

```bash
# Cloudflare API Token
CLOUDFLARE_API_TOKEN=tu-cloudflare-api-token

# Cloudflare Account ID
CLOUDFLARE_ACCOUNT_ID=tu-account-id

# Session Secret
NUXT_SESSION_SECRET=tu-secret-de-32-caracteres

# D1 Database ID
DATABASE_ID=tu-database-id

# WebAuthn Config
NUXT_PUBLIC_RP_ID=tu-proyecto.pages.dev
NUXT_PUBLIC_RP_NAME=Plataforma Fiscal
NUXT_PUBLIC_RP_ORIGIN=https://tu-proyecto.pages.dev

# Email Config
EMAIL_SERVICE=mailchannels
EMAIL_FROM=noreply@tu-proyecto.pages.dev
EMAIL_FROM_NAME=Plataforma Fiscal

# Opcional: Sentry
NUXT_PUBLIC_SENTRY_DSN=tu-sentry-dsn
```

### Crear Workflow

El proyecto ya incluye `.github/workflows/deploy.yml` que se activa automáticamente en push a `main`.

---

## 🐛 Troubleshooting

### Error: "nuxt: not found" durante build

**Solución:**
```bash
npm install --legacy-peer-deps
```

### Error: "Session secret not configured"

**Solución:** Asegúrate de configurar `NUXT_SESSION_SECRET` en las variables de entorno de Cloudflare Pages.

### Error: "Database not found"

**Solución:**
1. Verifica que la base de datos D1 esté creada
2. Verifica el binding en Cloudflare Pages (**Settings** > **Functions** > **D1 database bindings**)
3. Variable debe llamarse `DB`

### 2FA no funciona

**Solución:**
1. Verifica que `NUXT_PUBLIC_RP_ID` coincida con tu dominio (sin `https://`)
2. Verifica que `NUXT_PUBLIC_RP_ORIGIN` incluya `https://`
3. En local usa `localhost` sin puerto en `RP_ID`

### Emails no se envían

**Solución MailChannels:**
- MailChannels solo funciona desde Cloudflare Workers/Pages
- No funcionará en desarrollo local (se loggean en consola)
- Verifica que `EMAIL_SERVICE=mailchannels` esté configurado

**Solución SendGrid/Postmark:**
- Verifica que el API key esté configurado
- Verifica que el email FROM esté verificado en el servicio

### Build falla con error de memoria

**Solución:**
```bash
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

### PWA no se instala

**Solución:**
1. Los iconos deben existir en `/public/icons/`
2. Ejecuta `node scripts/generate-icons.js` si faltan
3. Verifica en DevTools > Application > Manifest

---

## 📊 Recursos Adicionales

### Documentación

- [Cloudflare Pages](https://developers.cloudflare.com/pages/)
- [Cloudflare D1](https://developers.cloudflare.com/d1/)
- [Nuxt 3](https://nuxt.com/docs)
- [WebAuthn Guide](https://webauthn.guide/)
- [MailChannels Docs](https://mailchannels.zendesk.com/hc/en-us/articles/4565898358413)

### Límites del Tier Gratuito

| Servicio | Límite Gratuito |
|----------|----------------|
| Cloudflare Pages | 500 builds/mes, 100k requests/día |
| Cloudflare D1 | 10 GB storage, 5M reads/día, 100k writes/día |
| Cloudflare Workers | 100k requests/día |
| MailChannels | Ilimitado (solo desde CF Workers) |
| Sentry | 10k eventos/mes |

### Soporte

- [GitHub Issues](https://github.com/tu-repo/issues)
- [Cloudflare Community](https://community.cloudflare.com/)
- [Nuxt Discord](https://discord.com/invite/nuxt)

---

## 🎉 ¡Listo!

Tu aplicación ahora está corriendo en producción con:
- ✅ 2FA con WebAuthn
- ✅ Audit Logs
- ✅ Email notifications
- ✅ PWA instalable
- ✅ Security headers
- ✅ Edge runtime (súper rápido)

**Costo total:** $0/mes con el tier gratuito 🎊

---

**Última actualización:** 2025-11-13
**Versión:** 2.0.0
