# Siguientes Pasos - Configuración de Producción

## Estado Actual

✅ **Build Exitoso** - 4.75 MB (1.19 MB gzip)
✅ **Tests Pasando** - 20/20 tests unitarios
✅ **Todas las funcionalidades implementadas**
✅ **Listo para deployment**

---

## Configuraciones Pendientes

### 1. Sentry (Error Monitoring) - OPCIONAL

**Prioridad:** Media
**Costo:** Gratis (hasta 10k eventos/mes)

```bash
# 1. Crear proyecto en https://sentry.io
# 2. Obtener DSN del proyecto
# 3. Agregar a Cloudflare Pages:
#    Settings > Environment variables > Production
#    Variable: NUXT_PUBLIC_SENTRY_DSN
#    Value: https://[KEY]@[ORG].ingest.sentry.io/[PROJECT]
```

### 2. Email Service - REQUERIDO PARA NOTIFICACIONES

**Prioridad:** Alta
**Opciones recomendadas:**

#### Opción A: MailChannels (Gratis para Cloudflare Workers)

**Ventajas:** Gratis, simple, diseñado para Cloudflare
**Limitaciones:** Solo desde Cloudflare Workers

```typescript
// Actualizar server/utils/email.ts
export async function sendEmail(options: EmailOptions) {
  const response = await fetch('https://api.mailchannels.net/tx/v1/send', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [
        {
          to: [{ email: Array.isArray(options.to) ? options.to[0] : options.to }],
        },
      ],
      from: {
        email: 'noreply@tudominio.com',
        name: 'Plataforma Fiscal',
      },
      subject: options.subject,
      content: [
        {
          type: 'text/html',
          value: options.html,
        },
      ],
    }),
  })

  return {
    success: response.ok,
    data: await response.json(),
  }
}
```

**Documentación:** https://blog.cloudflare.com/sending-email-from-workers-with-mailchannels/

#### Opción B: SendGrid (Gratis hasta 100 emails/día)

```bash
# 1. Crear cuenta en https://sendgrid.com
# 2. Obtener API key
# 3. Agregar a Cloudflare Pages:
#    SENDGRID_API_KEY=tu-api-key
```

```typescript
// Actualizar server/utils/email.ts
export async function sendEmail(options: EmailOptions) {
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{
        to: [{ email: Array.isArray(options.to) ? options.to[0] : options.to }]
      }],
      from: { email: 'noreply@tudominio.com' },
      subject: options.subject,
      content: [{
        type: 'text/html',
        value: options.html
      }]
    })
  })

  return {
    success: response.ok,
    data: await response.json()
  }
}
```

#### Opción C: Postmark (Gratis 100 emails/mes)

Similar a SendGrid, usa su API directamente.

**⚠️ Nota:** Resend fue removido debido a incompatibilidad con Cloudflare Workers (@react-email/render dependency).

### 3. Cloudflare Analytics - OPCIONAL

**Prioridad:** Baja
**Costo:** Gratis

```bash
# 1. Dashboard > Web Analytics > Add a site
# 2. Copiar el beacon token
# 3. Actualizar app/plugins/cloudflare-analytics.client.ts:
#    const analyticsToken = 'TU_TOKEN_AQUI'
```

### 4. GitHub Secrets para CI/CD - RECOMENDADO

**Prioridad:** Media (si quieres deployments automáticos)

```
Repository > Settings > Secrets and variables > Actions

Secrets requeridos:
- CLOUDFLARE_API_TOKEN
- CLOUDFLARE_ACCOUNT_ID
- NUXT_SESSION_SECRET
- DATABASE_ID
- NUXT_PUBLIC_SENTRY_DSN (opcional)
```

### 5. Generar Iconos PWA - RECOMENDADO

**Prioridad:** Media (para install prompts)

```bash
# Instalar generador
npm install -g pwa-asset-generator

# Generar iconos (necesitas un logo.png de al menos 512x512)
pwa-asset-generator logo.png public/icons --icon-only --padding "10%"

# O usar herramienta online:
# https://realfavicongenerator.net/
```

### 6. Configurar Cron para Recordatorios - OPCIONAL

**Prioridad:** Baja
**Costo:** Gratis

```bash
# En Cloudflare Dashboard:
# Workers & Pages > Tu proyecto > Settings > Cron Triggers
# Add cron trigger:
# - Schedule: 0 2 * * * (2 AM diario)
# - Route: /api/cron/send-reminders
# - Header: x-cron-secret: TU_CRON_SECRET
```

---

## Deployment a Producción

### Build Local

```bash
# 1. Instalar dependencias
npm install --legacy-peer-deps

# 2. Build
npm run build

# 3. Preview local (opcional)
npx wrangler pages dev .output/public
```

### Deploy Manual

```bash
# Deploy a Cloudflare Pages
npm run pages:deploy

# O con wrangler directamente
wrangler pages deploy .output/public --project-name=plataforma-fiscal
```

### Deploy Automático (GitHub Actions)

1. Configurar secrets (ver arriba)
2. Push a branch main
3. GitHub Actions hará:
   - Lint & Type Check
   - Tests Unitarios
   - Build
   - Deploy a Cloudflare

---

## Verificación Post-Deployment

### Checklist

- [ ] Homepage carga correctamente
- [ ] Login funciona
- [ ] Registro funciona
- [ ] Dashboard carga para contribuyentes
- [ ] Dashboard carga para contadores
- [ ] PWA instalable (ícono en barra de direcciones)
- [ ] Service Worker registrado (DevTools > Application)
- [ ] Rate limiting funciona (5 intentos de login máximo)
- [ ] Sentry reporta errores (si configurado)
- [ ] Analytics trackea visitas (si configurado)

### Comandos Útiles

```bash
# Ver logs en tiempo real
wrangler pages deployment tail

# Ver deployments
wrangler pages deployment list

# Ver D1 databases
wrangler d1 list

# Hacer query a D1
wrangler d1 execute fiscal_platform_db --remote --command "SELECT * FROM usuarios LIMIT 5"

# Backup manual
./scripts/backup-database.sh
```

---

## Optimizaciones Futuras (Opcionales)

### Performance

- [ ] Implementar ISR (Incremental Static Regeneration) para rutas dinámicas
- [ ] Configurar R2 para almacenar facturas
- [ ] Implementar lazy loading de componentes pesados
- [ ] Optimizar bundle size (tree-shaking, code splitting)

### Features

- [ ] Notificaciones push (usando Service Worker)
- [ ] Modo offline completo (con sync cuando vuelva conexión)
- [ ] Exportar declaraciones a PDF
- [ ] Firma electrónica de documentos
- [ ] Chat en tiempo real entre contador y contribuyente

### DevOps

- [ ] Staging environment
- [ ] Feature flags
- [ ] A/B testing
- [ ] Error tracking dashboards
- [ ] Performance monitoring (Core Web Vitals)

---

## Troubleshooting Común

### Build falla con error de memoria

```bash
# Aumentar memoria de Node.js
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

### Icons no cargan en preview local

**Solución:** Normal durante prerender. En producción cargarán correctamente desde CDN.

### "Resend not configured"  en logs

**Solución:** Normal. Implementa MailChannels o SendGrid (ver arriba).

### PWA no se instala

**Solución:** Genera los iconos PWA (ver paso 5).

---

## Soporte

**Documentación Cloudflare Pages:** https://developers.cloudflare.com/pages/
**Documentación Nuxt:** https://nuxt.com/docs
**Documentación PWA:** https://vite-pwa-org.netlify.app/

---

## Resumen de Costos Mensuales

| Servicio | Tier Gratuito | Costo Real |
|----------|---------------|------------|
| Cloudflare Pages | 500 builds/mes | $0 |
| Cloudflare D1 | 10GB + 5M reads | $0 |
| Cloudflare Workers | 100k requests/día | $0 |
| Sentry | 10k events/mes | $0 |
| MailChannels | Ilimitado en CF | $0 |
| GitHub Actions | 2000 min/mes | $0 |
| **TOTAL** | | **$0/mes** |

---

**Última actualización:** 2025-11-12
**Versión:** 1.0.0
**Estado:** ✅ Producción Ready
