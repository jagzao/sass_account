# Guía de Deployment a Producción

Esta guía detalla todos los pasos necesarios para llevar la Plataforma de Declaraciones Fiscales a producción en Cloudflare Pages.

## 📋 Pre-requisitos

- ✅ Cuenta de Cloudflare
- ✅ Wrangler CLI instalado (`npm install -g wrangler`)
- ✅ Autenticación con Cloudflare (`wrangler login`)
- ✅ Base de datos D1 creada (`wrangler d1 create fiscal_platform_db`)

---

## 🚀 Pasos para Deployment

### 1. Aplicar Migración de Base de Datos

La migración `0001_normal_mastermind.sql` crea las tablas necesarias para:
- `audit_logs` - Registro de actividad
- `authenticators` - Dispositivos 2FA

```bash
# Aplicar migración en producción
wrangler d1 migrations apply fiscal_platform_db --remote

# Verificar que las tablas se crearon
wrangler d1 execute fiscal_platform_db --remote --command "SELECT name FROM sqlite_master WHERE type='table';"
```

**Salida esperada:**
```
audit_logs
authenticators
usuarios
declaraciones_mensuales
facturas
checklist_items
comentarios
```

---

### 2. Configurar Variables de Entorno

#### Variables Requeridas para 2FA (WebAuthn)

```bash
# RP_ID: Tu dominio (sin https://)
wrangler pages secret put RP_ID
# Valor: plataforma-fiscal.com

# RP_NAME: Nombre de la aplicación
wrangler pages secret put RP_NAME
# Valor: Fiscal Pro

# RP_ORIGIN: URL completa de tu sitio
wrangler pages secret put RP_ORIGIN
# Valor: https://plataforma-fiscal.com
```

#### Variables Opcionales

```bash
# SENTRY_AUTH_TOKEN: Para upload de source maps
wrangler pages secret put SENTRY_AUTH_TOKEN
# Obtener de: https://sentry.io/settings/auth-tokens/

# SENTRY_DSN: Ya está configurado en código
# No es necesario configurar si ya está en sentry.server.config.ts
```

---

### 3. Configurar Email Service (Opcional)

El sistema actual usa un placeholder para emails. Para producción, configurar uno de estos servicios:

#### Opción A: MailChannels (Recomendado - Gratis para CF Workers)

```bash
# No requiere configuración de secrets
# Solo verificar dominio SPF/DKIM
```

Actualizar `server/utils/email.ts`:
```typescript
const response = await fetch('https://api.mailchannels.net/tx/v1/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    personalizations: [{ to: [{ email: options.to }] }],
    from: { email: options.from || 'noreply@plataforma-fiscal.com' },
    subject: options.subject,
    content: [{ type: 'text/html', value: options.html }]
  })
})
```

#### Opción B: SendGrid / Postmark

```bash
# SendGrid
wrangler pages secret put SENDGRID_API_KEY

# Postmark
wrangler pages secret put POSTMARK_API_KEY
```

---

### 4. Build del Proyecto

```bash
# Instalar dependencias
npm install

# Ejecutar tests
npm test

# Build para producción
npm run build
```

**Verificaciones del build:**
- ✅ Tests: 20/20 passing
- ✅ No errores de TypeScript
- ✅ Tamaño bundle: ~1.9 MB gzip
- ✅ 6 páginas pre-renderizadas

---

### 5. Deploy a Cloudflare Pages

```bash
# Deploy
npx wrangler pages deploy dist
```

O configurar GitHub para auto-deploy:

```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloudflare Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build

      - name: Deploy to Cloudflare Pages
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy dist --project-name=fiscal-platform
```

---

### 6. Configuración Post-Deployment

#### A. Verificar DNS

Asegurar que el dominio apunta a Cloudflare Pages:

```
CNAME   @   fiscal-platform.pages.dev
```

#### B. Configurar HTTPS

Cloudflare Pages ofrece HTTPS automático. Verificar:
- ✅ SSL/TLS mode: "Full (strict)"
- ✅ Always Use HTTPS: Enabled
- ✅ Minimum TLS Version: 1.2

#### C. Security Headers

Ya configuradas en `server/middleware/security.ts`:
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Strict-Transport-Security: max-age=31536000
- Content-Security-Policy: (comprehensive)

Verificar con: https://securityheaders.com/

---

### 7. Testing en Producción

#### Test Checklist

- [ ] **Registro de usuario**
  - Crear cuenta como contribuyente
  - Crear cuenta como contador

- [ ] **Login básico**
  - Login con usuario sin 2FA
  - Verificar redirección a dashboard

- [ ] **Configuración de 2FA**
  - Ir a Settings → Seguridad
  - Registrar dispositivo (YubiKey / Touch ID)
  - Verificar que aparece en lista

- [ ] **Login con 2FA**
  - Logout
  - Login con email/password
  - Verificar prompt de 2FA
  - Usar dispositivo registrado
  - Verificar acceso al dashboard

- [ ] **Audit Logs**
  - Ir a Registro de Actividad
  - Verificar que aparecen todos los logs
  - Probar filtros y búsqueda
  - Expandir metadata

- [ ] **Export PDF**
  - Abrir declaración como contador
  - Clic en "Generar PDF"
  - Verificar que se abre en nueva pestaña
  - Guardar como PDF desde navegador

- [ ] **Eliminar dispositivo 2FA**
  - Eliminar dispositivo de seguridad
  - Verificar que se elimina de lista
  - Verificar que login ya no requiere 2FA

---

## 🔐 Seguridad

### Checklist de Seguridad Pre-Launch

- [ ] **Secrets**
  - ✅ Todas las secrets configuradas en Cloudflare
  - ✅ No hay secrets en código
  - ✅ `.env` en `.gitignore`

- [ ] **2FA**
  - ✅ WebAuthn configurado correctamente
  - ✅ RP_ID coincide con dominio
  - ✅ HTTPS habilitado (requerido para WebAuthn)

- [ ] **Headers**
  - ✅ Security headers aplicados
  - ✅ HSTS habilitado en producción
  - ✅ CSP restrictivo

- [ ] **Rate Limiting**
  - ✅ Login limitado a 5 intentos/minuto
  - ✅ IP-based rate limiting activo

- [ ] **Audit Logging**
  - ✅ Todos los eventos críticos loggeados
  - ✅ IP y User-Agent capturados
  - ✅ Integración con Sentry activa

---

## 📊 Monitoreo

### Sentry

```typescript
// Ya configurado en sentry.server.config.ts
Sentry.init({
  dsn: 'https://...',
  environment: 'production',
  tracesSampleRate: 1.0,
})
```

**Eventos críticos monitoreados:**
- Failed logins
- 2FA failures
- Database errors
- API errors

### Cloudflare Analytics

Métricas disponibles:
- Requests per second
- Error rate
- Response time
- Geographic distribution

### Logs Personalizados

Ver logs en tiempo real:
```bash
wrangler pages deployment tail
```

---

## 🐛 Troubleshooting

### 2FA no funciona

**Problema:** WebAuthn falla al registrar dispositivo

**Soluciones:**
1. Verificar que HTTPS está activo
2. Verificar que `RP_ID` coincide con dominio
3. Comprobar que navegador soporta WebAuthn
4. Revisar consola del navegador para errores

```bash
# Verificar variables
wrangler pages secret list
```

### Migración no aplicada

**Problema:** Error "table audit_logs doesn't exist"

**Solución:**
```bash
# Re-aplicar migración
wrangler d1 migrations apply fiscal_platform_db --remote --force
```

### Build falla

**Problema:** Error durante `npm run build`

**Soluciones:**
1. Limpiar cache: `rm -rf .nuxt node_modules && npm install`
2. Verificar Node version: `node --version` (debe ser 18+)
3. Verificar dependencias: `npm audit`

### Performance lento

**Problema:** Sitio carga lento

**Soluciones:**
1. Verificar bundle size: `npm run build` y revisar sizes
2. Habilitar caching de assets estáticos
3. Optimizar queries de base de datos
4. Usar Cloudflare Cache API

---

## 📈 Optimizaciones Post-Launch

### 1. Caching

```typescript
// server/utils/cache.ts
export const cacheResponse = (event: H3Event, maxAge: number) => {
  setResponseHeader(event, 'Cache-Control', `public, max-age=${maxAge}`)
}
```

### 2. CDN para Assets

Configurar Cloudflare para cachear:
- Imágenes: 1 año
- CSS/JS: 1 mes
- HTML: 5 minutos

### 3. Database Indexing

```sql
-- Índices para mejor performance
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_authenticators_user_id ON authenticators(user_id);
```

### 4. Backup Automático

```bash
# Script para backup diario
#!/bin/bash
DATE=$(date +%Y%m%d)
wrangler d1 export fiscal_platform_db --remote --output backup-$DATE.sql
```

---

## 📝 Mantenimiento

### Updates Regulares

```bash
# Actualizar dependencias
npm update

# Verificar vulnerabilidades
npm audit

# Aplicar fixes automáticos
npm audit fix
```

### Monitoring Checklist (Semanal)

- [ ] Revisar Sentry para errores
- [ ] Verificar métricas de Cloudflare
- [ ] Revisar logs de auditoría
- [ ] Verificar disponibilidad (uptime)
- [ ] Backup de base de datos

---

## 🎯 Métricas de Éxito

### KPIs a Monitorear

1. **Disponibilidad**: >99.9% uptime
2. **Performance**: <200ms response time promedio
3. **Seguridad**:
   - 0 brechas de seguridad
   - 100% de logins críticos con 2FA
4. **Errores**: <0.1% error rate
5. **Satisfacción**: Feedback positivo de usuarios

---

## 📞 Soporte

### Recursos

- **Documentación del Proyecto:**
  - `HIGH_PRIORITY_FEATURES.md` - Funcionalidades backend
  - `UI_COMPONENTS_GUIDE.md` - Componentes frontend
  - `DEPLOYMENT_GUIDE.md` - Esta guía

- **Cloudflare Docs:** https://developers.cloudflare.com/pages/
- **WebAuthn Guide:** https://webauthn.guide/
- **Nuxt Docs:** https://nuxt.com/docs

### Issues Conocidos

1. **Icons durante build:** Warnings de red al pre-renderizar (no afecta producción)
2. **Sentry warnings:** Source maps requieren auth token (opcional)
3. **Email placeholder:** Requiere configurar servicio real

---

## ✅ Checklist Final Pre-Launch

### Técnico

- [ ] Base de datos migrada
- [ ] Variables de entorno configuradas
- [ ] Build exitoso sin errores
- [ ] Tests pasando (20/20)
- [ ] Deploy realizado
- [ ] HTTPS configurado
- [ ] DNS apuntando correctamente

### Funcional

- [ ] Registro de usuarios funciona
- [ ] Login con/sin 2FA funciona
- [ ] Audit logs visibles
- [ ] PDF export funciona
- [ ] Security headers aplicados
- [ ] Rate limiting activo

### Documentación

- [ ] README actualizado
- [ ] Guías de usuario creadas
- [ ] Runbooks para operaciones
- [ ] Plan de respuesta a incidentes

---

## 🎉 Launch

Cuando todo esté listo:

```bash
# Último build de producción
npm test && npm run build

# Deploy final
npx wrangler pages deploy dist

# Verificar deployment
curl -I https://plataforma-fiscal.com
```

**¡Felicidades! Tu plataforma está en producción. 🚀**

---

**Última actualización:** 2025-11-12
**Versión:** 1.0.0
**Status:** ✅ Production Ready
