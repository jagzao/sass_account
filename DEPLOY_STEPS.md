# 🚀 Deploy en Progreso - Plataforma Fiscal

## ✅ Pasos Completados

- [x] Wrangler CLI instalado (v4.46.0)
- [x] Proyecto configurado
- [x] Scripts de deployment listos

---

## 📋 Próximos Pasos (5 minutos)

### Paso 1: Autenticar Wrangler

**Ejecuta en tu terminal:**
```bash
wrangler login
```

Se abrirá tu navegador. Como ya tienes cuenta de Cloudflare:
1. Confirma el acceso
2. Cierra el navegador cuando veas "Success!"

---

### Paso 2: Crear Database D1

**Ejecuta:**
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

**IMPORTANTE:** Copia el `database_id` (el UUID largo)

---

### Paso 3: Actualizar wrangler.toml

**Edita el archivo `wrangler.toml` línea 9:**

```toml
# Antes:
database_id = "your-database-id"

# Después:
database_id = "TU-DATABASE-ID-COPIADO"
```

---

### Paso 4: Generar Schema SQL

**Ejecuta:**
```bash
npm run db:generate
```

Esto crea los archivos SQL en la carpeta `drizzle/`

---

### Paso 5: Aplicar Migraciones a D1

**Ejecuta:**
```bash
npm run d1:migrations
```

Confirma con: **yes**

---

### Paso 6: Build del Proyecto

**Ejecuta:**
```bash
npm run build
```

Esto puede tomar 1-2 minutos...

---

### Paso 7: Deploy a Cloudflare Pages

**Ejecuta:**
```bash
npm run pages:deploy
```

---

### Paso 8: Configurar Variables de Entorno

**En Cloudflare Dashboard:**
1. Ve a: https://dash.cloudflare.com
2. Pages > `plataforma-fiscal` > Settings > Environment variables
3. Agrega estas variables:

**Variable 1:**
```
Name: NUXT_SESSION_SECRET
Value: <ejecuta en terminal: openssl rand -base64 32>
Environment: Production
```

**Variable 2:**
```
Name: DATABASE_ID
Value: <tu-database-id-de-D1>
Environment: Production
```

4. Click "Save"
5. Deployments > Retry deployment

---

## 🎉 ¡Listo!

Tu app estará en:
```
https://plataforma-fiscal-colaborativa.pages.dev
```

O el nombre que Cloudflare asigne.

---

## 🐛 Si algo falla:

**Error: "Not authenticated"**
```bash
wrangler logout
wrangler login
```

**Error: "Database not found"**
```bash
# Verifica el database_id en wrangler.toml
wrangler d1 list
```

**Error: "Build failed"**
```bash
# Limpia node_modules
rm -rf node_modules .nuxt
npm install
npm run build
```

---

## 📊 Monitorear después del deploy:

```bash
# Ver logs en tiempo real
npm run pages:tail

# Ver databases
npm run d1:list

# Ejecutar query
npm run d1:query "SELECT COUNT(*) FROM usuarios;"
```

---

**Status:** Esperando que completes Paso 1 (wrangler login)
