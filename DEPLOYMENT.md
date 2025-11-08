# 🚀 Guía de Deployment a Cloudflare (Costo $0)

Esta guía te ayudará a deployar la Plataforma Fiscal Colaborativa en Cloudflare completamente **GRATIS**.

---

## 📋 Requisitos Previos

- ✅ Cuenta de Cloudflare (gratis)
- ✅ Node.js 18+ instalado
- ✅ Git instalado
- ✅ Proyecto clonado localmente

---

## 🎯 Paso 1: Crear Cuenta en Cloudflare

### 1.1 Registro (100% Gratis)

```bash
1. Visita: https://dash.cloudflare.com/sign-up
2. Ingresa tu email
3. Verifica tu email
4. ¡Listo! No necesitas tarjeta de crédito
```

### 1.2 Obtener Account ID

```bash
1. Login en: https://dash.cloudflare.com
2. Click en "Workers & Pages" (sidebar izquierdo)
3. Copia tu "Account ID" (lo necesitarás después)
```

---

## 🔧 Paso 2: Instalar Wrangler CLI

```bash
# Instalar globalmente
npm install -g wrangler

# Verificar instalación
wrangler --version

# Autenticarse
wrangler login
# Se abrirá tu navegador para autorizar
```

---

## 🗄️ Paso 3: Crear Base de Datos D1

### 3.1 Crear la Database

```bash
# Crear database
wrangler d1 create fiscal_platform_db

# Output:
# ✅ Successfully created DB 'fiscal_platform_db'!
#
# [[d1_databases]]
# binding = "DB"
# database_name = "fiscal_platform_db"
# database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

### 3.2 Copiar el Database ID

```bash
# IMPORTANTE: Copia el database_id del output anterior
```

### 3.3 Actualizar wrangler.toml

```toml
# wrangler.toml
name = "plataforma-fiscal"
compatibility_date = "2024-11-01"

[[d1_databases]]
binding = "DB"
database_name = "fiscal_platform_db"
database_id = "TU-DATABASE-ID-AQUI"  # <-- Pega tu ID aquí
```

---

## 📊 Paso 4: Configurar Schema de Base de Datos

### 4.1 Generar SQL Schema

```bash
# Generar archivos SQL desde Drizzle
npm run db:generate

# Esto crea archivos en: drizzle/
```

### 4.2 Aplicar Migraciones a D1

```bash
# Aplicar schema a la database remota
wrangler d1 migrations apply fiscal_platform_db --remote

# Confirmar con: yes
```

### 4.3 Verificar que funcionó

```bash
# Listar tablas
wrangler d1 execute fiscal_platform_db --remote --command "SELECT name FROM sqlite_master WHERE type='table';"

# Deberías ver: usuarios, declaraciones_mensuales, facturas, etc.
```

---

## 🌱 Paso 5: Poblar con Datos de Prueba (Opcional)

### 5.1 Opción A: Script Manual

```bash
# Crear datos de prueba localmente primero
npm install --save-dev better-sqlite3 tsx nanoid

# Ejecutar seed local
npx tsx server/db/seed.ts

# Exportar datos
sqlite3 local.db .dump > seed.sql

# Importar a D1
wrangler d1 execute fiscal_platform_db --remote --file=seed.sql
```

### 5.2 Opción B: Crear usuarios manualmente

```sql
-- Ejecutar en D1
wrangler d1 execute fiscal_platform_db --remote --command "
INSERT INTO usuarios (id, email, hashed_password, nombre, apellidos, rfc, rol, created_at, updated_at)
VALUES (
  'user_test_1',
  'test@ejemplo.com',
  '\$argon2id\$v=19\$m=19456,t=2,p=1\$...',  -- Hash de 'Password123!'
  'Usuario',
  'Prueba',
  'TEST123456ABC',
  'contribuyente',
  datetime('now'),
  datetime('now')
);
"
```

---

## 🚀 Paso 6: Deploy a Cloudflare Pages

### 6.1 Opción A: Deploy Automático con GitHub

**Recomendado para producción**

```bash
# 1. Push tu código a GitHub
git add .
git commit -m "chore: preparar para deployment"
git push origin main

# 2. En Cloudflare Dashboard:
#    - Pages > Create a project
#    - Connect to Git
#    - Seleccionar tu repositorio
#    - Configure build:

Build command: npm run build
Build output: .output/public
Root directory: (leave empty)
Framework preset: Nuxt.js

# 3. Environment variables (agregar):
NUXT_SESSION_SECRET=<tu-secret-de-32-chars>
DATABASE_ID=<tu-database-id>

# 4. Save and Deploy
```

### 6.2 Opción B: Deploy Directo desde CLI

**Más rápido para testing**

```bash
# 1. Build
npm run build

# 2. Deploy
wrangler pages deploy .output/public --project-name=plataforma-fiscal

# 3. Confirmar
# Tu app estará en: https://plataforma-fiscal.pages.dev
```

### 6.3 Opción C: Script Automatizado

```bash
# Usar nuestro script
chmod +x scripts/deploy-cloudflare.sh
./scripts/deploy-cloudflare.sh
```

---

## ⚙️ Paso 7: Configurar Variables de Entorno

### 7.1 Generar Session Secret

```bash
# Genera un secret seguro
openssl rand -base64 32

# Copia el output
```

### 7.2 Configurar en Cloudflare

```bash
# Dashboard:
1. Pages > Tu Proyecto > Settings > Environment variables
2. Add variable:
   - Name: NUXT_SESSION_SECRET
   - Value: <tu-secret-generado>
   - Environment: Production

3. Add variable:
   - Name: DATABASE_ID
   - Value: <tu-database-id>
   - Environment: Production

4. Save
```

### 7.3 Re-deploy para Aplicar Cambios

```bash
# Desde Dashboard: Deployments > Retry deployment
# O desde CLI:
wrangler pages deployment create
```

---

## ✅ Paso 8: Verificar que Todo Funciona

### 8.1 Acceder a tu App

```bash
# Tu URL será:
https://plataforma-fiscal.pages.dev

# O tu dominio custom si configuraste uno:
https://tu-dominio.com
```

### 8.2 Checklist de Verificación

- [ ] La página principal carga correctamente
- [ ] Puedes navegar a /login
- [ ] Los estilos (Tailwind) se ven bien
- [ ] No hay errores en la consola del navegador
- [ ] Puedes hacer login con usuarios de prueba
- [ ] El dashboard carga datos correctamente

### 8.3 Debugging

```bash
# Ver logs en tiempo real
wrangler pages deployment tail

# Ver deployments
wrangler pages deployment list

# Ver database
wrangler d1 execute fiscal_platform_db --remote --command "SELECT * FROM usuarios LIMIT 5;"
```

---

## 📊 Monitoreo del Tier Gratuito

### Ver tu Uso Actual

```bash
# Dashboard:
https://dash.cloudflare.com/

# Analytics:
Pages > Tu Proyecto > Analytics

# Database:
D1 > fiscal_platform_db > Metrics
```

### Límites del Tier Gratuito

```
✅ Cloudflare Pages:
   - 500 builds/mes
   - 100,000 requests/día
   - Bandwidth ilimitado
   - SSL gratis

✅ D1 Database:
   - 10 GB almacenamiento
   - 5,000,000 filas leídas/día
   - 100,000 filas escritas/día

✅ Workers:
   - 100,000 requests/día
   - 10ms CPU time/request

⚠️ Si excedes los límites:
   - Recibirás un email de aviso
   - No se te cobrará automáticamente
   - Puedes upgrade cuando quieras
```

### Optimizaciones para Mantenerse Gratis

```typescript
// 1. Cachear agresivamente
export default defineNuxtConfig({
  routeRules: {
    '/': { prerender: true },
    '/login': { prerender: true },
    '/api/declaraciones': {
      swr: 120, // Cache 2 minutos
      isr: true
    }
  }
})

// 2. Usar ISR/SWR para reducir requests a DB
// 3. Pre-renderizar páginas estáticas
// 4. Lazy load de imágenes y componentes
```

---

## 🔒 Paso 9: Seguridad en Producción

### 9.1 Variables de Entorno Seguras

```bash
# NUNCA commitees:
- .env
- Secrets
- API Keys

# SIEMPRE usa:
- Variables de entorno de Cloudflare
- Secrets en wrangler.toml (encrypted)
```

### 9.2 Headers de Seguridad

Ya están configurados en `nuxt.config.ts`:
- CSP (Content Security Policy)
- X-Frame-Options
- X-Content-Type-Options
- Referrer-Policy

### 9.3 Rate Limiting

Considera agregar:

```typescript
// server/middleware/rateLimit.ts
// Limitar requests por IP
```

---

## 🌐 Paso 10: Dominio Custom (Opcional)

### 10.1 Agregar Dominio

```bash
# Dashboard:
1. Pages > Tu Proyecto > Custom domains
2. Add custom domain
3. Ingresa: tudominio.com
4. Sigue las instrucciones DNS
```

### 10.2 DNS Records

```bash
# En tu proveedor de dominio (GoDaddy, Namecheap, etc.):
# Agrega estos records:

Type: CNAME
Name: @
Value: plataforma-fiscal.pages.dev

Type: CNAME
Name: www
Value: plataforma-fiscal.pages.dev
```

### 10.3 SSL/HTTPS

```bash
# Cloudflare provee SSL automáticamente
# Tu sitio será HTTPS sin costo adicional
```

---

## 🔄 Actualizaciones Continuas

### Deploy Automático con Git

```bash
# Cada push a main triggerea un deploy automático:
git add .
git commit -m "feat: nueva funcionalidad"
git push origin main

# Cloudflare detecta el push y deploya automáticamente
```

### Rollback a Versión Anterior

```bash
# Dashboard:
1. Pages > Tu Proyecto > Deployments
2. Click en deployment anterior
3. "Rollback to this deployment"

# CLI:
wrangler pages deployment list
wrangler pages deployment rollback <deployment-id>
```

---

## 📞 Soporte y Troubleshooting

### Errores Comunes

#### "Database not found"
```bash
# Verifica database_id en wrangler.toml
wrangler d1 list
```

#### "Session secret not set"
```bash
# Agrega NUXT_SESSION_SECRET en environment variables
# Dashboard > Settings > Environment variables
```

#### "Build failed"
```bash
# Verifica que el build funciona local:
npm run build

# Revisa logs:
# Dashboard > Deployments > Ver logs
```

### Recursos

- 📚 Docs Cloudflare: https://developers.cloudflare.com/pages/
- 💬 Discord Nuxt: https://discord.com/invite/nuxt
- 🐛 Issues: https://github.com/tu-repo/issues

---

## 🎉 ¡Listo!

Tu aplicación está ahora deployada en Cloudflare con:

✅ **Costo $0** (tier gratuito)
✅ **SSL/HTTPS** automático
✅ **CDN global** (300+ ubicaciones)
✅ **Auto-scaling** sin configuración
✅ **Database** en el edge
✅ **Backups** automáticos
✅ **99.99% uptime** SLA

---

## 📊 Próximos Pasos

1. ✅ Configura monitoreo (Sentry gratis)
2. ✅ Agrega analytics (Cloudflare Web Analytics gratis)
3. ✅ Configura emails (Resend 3k/mes gratis)
4. ✅ Agrega dominio custom
5. ✅ Configura CI/CD con GitHub Actions

---

**¿Necesitas ayuda?** Abre un issue en el repositorio o contacta al equipo.
