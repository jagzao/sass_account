# 🪟 Deploy desde Windows - Paso a Paso

**Ubicación:** `C:\Dev\Zo\sass_account`

---

## ✅ Opción 1: Script Automatizado (Recomendado)

Ejecuta esto en PowerShell:

```powershell
.\deploy-windows.ps1
```

El script te guiará paso a paso con confirmaciones.

---

## ⚡ Opción 2: Comandos Individuales (Copia y Pega)

Si el script no funciona, copia y pega estos comandos uno por uno:

### 📦 Paso 1: Instalar Wrangler

```powershell
npm install -g wrangler
```

Verifica instalación:
```powershell
wrangler --version
```

---

### 🔐 Paso 2: Login a Cloudflare

```powershell
wrangler login
```

Se abrirá tu navegador. **Autoriza el acceso**.

---

### 🗄️ Paso 3: Crear Database D1

```powershell
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

**📝 IMPORTANTE:** Copia el `database_id` (el UUID largo)

---

### ✏️ Paso 4: Actualizar wrangler.toml

Abre `wrangler.toml` con un editor de texto (Notepad, VSCode, etc.)

Busca la **línea 9**:
```toml
database_id = "your-database-id"
```

Reemplázala con tu database_id:
```toml
database_id = "TU-DATABASE-ID-AQUI"
```

**Guarda el archivo**.

---

### 📊 Paso 5: Aplicar Schema a D1

```powershell
wrangler d1 migrations apply fiscal_platform_db --remote
```

Cuando pregunte, escribe: **yes**

---

### 🚀 Paso 6: Deploy a Cloudflare

```powershell
wrangler pages deploy .output/public --project-name=plataforma-fiscal
```

Espera 1-2 minutos...

---

### ⚙️ Paso 7: Generar Session Secret

```powershell
# PowerShell
$bytes = New-Object byte[] 32
[Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes($bytes)
[Convert]::ToBase64String($bytes)
```

**Copia el resultado.**

---

### 🌐 Paso 8: Configurar Variables en Cloudflare

1. Ve a: **https://dash.cloudflare.com**
2. **Pages** > **plataforma-fiscal** > **Settings** > **Environment variables**
3. Click en **Add variable**

**Variable 1:**
```
Name: NUXT_SESSION_SECRET
Value: <pega-el-secret-generado>
Environment: Production
```

**Variable 2:**
```
Name: DATABASE_ID
Value: <tu-database-id-de-D1>
Environment: Production
```

4. Click **Save**
5. Ve a **Deployments** > Click en el último deployment > **Retry deployment**

---

## 🎉 ¡LISTO!

Tu app estará disponible en:
```
https://plataforma-fiscal.pages.dev
```

O el nombre que Cloudflare le asigne.

---

## 🐛 Troubleshooting Windows

### Error: "wrangler no se reconoce"

**Solución 1:** Cierra y vuelve a abrir PowerShell
**Solución 2:** Reinicia tu terminal
**Solución 3:** Verifica instalación:
```powershell
npm list -g wrangler
```

---

### Error: "No se puede ejecutar scripts"

Ejecuta esto como **Administrador**:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

### Error: "EACCES: permission denied"

Abre PowerShell como **Administrador**:
1. Click derecho en PowerShell
2. "Ejecutar como administrador"
3. Repite el comando

---

### Error al crear D1 database

Verifica que estás autenticado:
```powershell
wrangler whoami
```

Si dice "not authenticated":
```powershell
wrangler logout
wrangler login
```

---

## 📊 Verificar que Todo Funciona

```powershell
# Ver tus databases
wrangler d1 list

# Ver deployments
wrangler pages deployment list

# Ver logs en tiempo real
wrangler pages deployment tail
```

---

## 💰 Costo Total

✅ **$0/mes** (tier gratuito de Cloudflare)

- Pages: Gratis
- D1 Database: Gratis
- Workers: Gratis
- SSL + CDN: Gratis

---

## 🆘 ¿Problemas?

1. Revisa **DEPLOY_NOW.md** para más detalles
2. Verifica que estás en la carpeta correcta: `C:\Dev\Zo\sass_account`
3. Asegúrate de tener conexión a internet
4. Verifica que Node/npm funcionen: `node --version`

---

**¡Éxito con tu deployment!** 🚀
