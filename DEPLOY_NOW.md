# 🚀 DEPLOY LISTO - Solo Faltan 3 Pasos

## ✅ Lo que YA está hecho:

- ✅ Build completado exitosamente (.output/public/)
- ✅ Schema SQL generado (server/db/migrations/)
- ✅ Código compatible con Cloudflare Workers
- ✅ Dependencias nativas removidas

---

## 📋 Solo te faltan estos 3 comandos:

### Paso 1: Crear Database D1 (30 segundos)

```bash
wrangler d1 create fiscal_platform_db
```

**Output esperado:**
```
✅ Successfully created DB 'fiscal_platform_db'!

[[d1_databases]]
binding = "DB"
database_name = "fiscal_platform_db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

**Copia el `database_id`** (el UUID largo)

---

### Paso 2: Actualizar wrangler.toml

Abre `wrangler.toml` y en la **línea 9**, reemplaza:

```toml
database_id = "your-database-id"
```

Por:

```toml
database_id = "TU-DATABASE-ID-COPIADO"
```

---

### Paso 3: Aplicar Schema y Deploy (1 minuto)

```bash
# Aplicar migraciones a D1
wrangler d1 migrations apply fiscal_platform_db --remote

# Deploy a Cloudflare Pages
wrangler pages deploy .output/public --project-name=plataforma-fiscal
```

---

## 🎉 ¡Listo!

Tu app estará en:
```
https://plataforma-fiscal.pages.dev
```

---

## ⚙️ Configurar Variables de Entorno (IMPORTANTE)

Después del deploy, configura estas variables en Cloudflare:

### 1. Generar Session Secret

```bash
openssl rand -base64 32
```

Copia el output.

### 2. Agregar en Cloudflare Dashboard

1. Ve a: https://dash.cloudflare.com
2. **Pages** > **plataforma-fiscal** > **Settings** > **Environment variables**
3. Agrega estas 2 variables:

**Variable 1:**
```
Name: NUXT_SESSION_SECRET
Value: <el-secret-que-generaste>
Environment: Production
```

**Variable 2:**
```
Name: DATABASE_ID
Value: <tu-database-id-de-D1>
Environment: Production
```

4. **Save**
5. **Deployments** > **Retry deployment**

---

## 🌱 Agregar Datos de Prueba (Opcional)

Para crear usuarios de ejemplo:

```bash
# Instalar dependencias locales
npm install --save-dev better-sqlite3 tsx nanoid

# Generar datos de prueba
npm run db:seed

# Exportar a SQL
sqlite3 local.db .dump > seed-data.sql

# Importar a D1
wrangler d1 execute fiscal_platform_db --remote --file=seed-data.sql
```

**Usuarios de prueba:**
- Contribuyente: `maria.gonzalez@test.com` / `TestPassword123!`
- Contador: `juan.perez@test.com` / `TestPassword456!`

---

## 📊 Verificar que Todo Funciona

1. Abre tu app: `https://plataforma-fiscal.pages.dev`
2. Haz clic en "Registrarse"
3. Crea una cuenta
4. Verifica que puedes hacer login

---

## 🐛 Si algo falla:

### "Database not found"
```bash
wrangler d1 list
```
Verifica que el database_id en wrangler.toml coincide.

### "Build failed" al hacer retry deployment
El build ya está hecho, solo usa:
```bash
wrangler pages deploy .output/public --project-name=plataforma-fiscal
```

### "Migrations failed"
```bash
# Ver el estado
wrangler d1 migrations list fiscal_platform_db --remote

# Aplicar de nuevo
wrangler d1 migrations apply fiscal_platform_db --remote
```

---

## 💰 Costo Total: $0/mes

Todo está configurado para el tier gratuito:
- ✅ Pages: Gratis
- ✅ D1: Gratis
- ✅ Workers: Gratis
- ✅ SSL: Gratis
- ✅ CDN Global: Gratis

---

## 📞 Monitoreo

Ver logs en tiempo real:
```bash
wrangler pages deployment tail
```

Ver database:
```bash
wrangler d1 execute fiscal_platform_db --remote --command "SELECT COUNT(*) as users FROM usuarios;"
```

---

**¿Listo?** Ejecuta los 3 pasos y en 2 minutos tendrás tu app online! 🚀
