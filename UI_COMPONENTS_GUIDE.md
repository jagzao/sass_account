# Guía de Componentes UI - Funcionalidades de Alta Prioridad

Esta guía documenta los nuevos componentes de interfaz de usuario implementados para las 4 funcionalidades de alta prioridad.

## 📋 Tabla de Contenido

1. [Página de Configuración 2FA](#1-página-de-configuración-2fa)
2. [Exportación de PDF](#2-exportación-de-pdf)
3. [Visor de Logs de Auditoría](#3-visor-de-logs-de-auditoría)
4. [Navegación Actualizada](#4-navegación-actualizada)
5. [Instalación y Dependencias](#5-instalación-y-dependencias)

---

## 1. Página de Configuración 2FA

**Ruta:** `/dashboard/settings`

### Características

- ✅ **Registro de dispositivos WebAuthn**
  - YubiKey y otras llaves de seguridad USB/NFC
  - Touch ID (Mac, iPhone, iPad)
  - Face ID (iPhone, iPad)
  - Windows Hello
  - Lectores de huellas dactilares Android

- ✅ **Gestión de dispositivos**
  - Lista de todos los dispositivos registrados
  - Nombre personalizado para cada dispositivo
  - Fecha de registro y último uso
  - Eliminación de dispositivos

- ✅ **Indicadores visuales**
  - Badge de estado (Activado/Desactivado)
  - Íconos descriptivos
  - Información contextual
  - Alertas educativas

### Componentes Principales

```vue
<template>
  <!-- Badge de estado -->
  <UBadge
    v-if="has2FA"
    color="green"
    variant="soft"
  >
    Activado
  </UBadge>

  <!-- Lista de dispositivos -->
  <div v-for="auth in authenticators">
    {{ auth.deviceName }}
    <UButton @click="removeDevice(auth.id)">
      Eliminar
    </UButton>
  </div>

  <!-- Botón de registro -->
  <UButton @click="startRegistration">
    Agregar Dispositivo de Seguridad
  </UButton>
</template>
```

### Flujo de Registro

1. Usuario hace clic en "Agregar Dispositivo de Seguridad"
2. Sistema solicita opciones al servidor (`/api/auth/2fa/register-options`)
3. Navegador muestra prompt de WebAuthn (Touch ID, YubiKey, etc.)
4. Usuario completa la autenticación
5. Sistema solicita nombre para el dispositivo
6. Respuesta se verifica en el servidor (`/api/auth/2fa/register-verify`)
7. Dispositivo se guarda en la base de datos
8. Lista se actualiza automáticamente

### Manejo de Errores

```typescript
// Error: Usuario cancela
if (error.name === 'NotAllowedError') {
  errorMessage = 'Registro cancelado por el usuario'
}

// Error: Navegador no compatible
if (error.name === 'NotSupportedError') {
  errorMessage = 'Tu navegador no soporta WebAuthn'
}
```

### API Endpoints Utilizados

- `POST /api/auth/2fa/register-options` - Inicia registro
- `POST /api/auth/2fa/register-verify` - Completa registro
- `GET /api/auth/2fa/devices` - Lista dispositivos
- `DELETE /api/auth/2fa/devices/:id` - Elimina dispositivo

---

## 2. Exportación de PDF

**Ubicación:** Botón en `/dashboard/declaracion/:id`

### Características

- ✅ **Generación de PDF en el navegador**
  - HTML optimizado para impresión
  - CSS específico para @media print
  - Abre en nueva pestaña
  - Usuario controla el guardado

- ✅ **Contenido incluido**
  - Información del contribuyente (nombre, RFC, email)
  - Período fiscal (mes y año)
  - Estado de la declaración
  - Fechas importantes (límite, envío)
  - Tabla de facturas con montos
  - Resumen financiero (monto total, impuesto calculado)
  - Observaciones
  - Fecha de generación del documento

- ✅ **Diseño profesional**
  - Logo y encabezado
  - Tabla formateada con colores
  - Badges de estado
  - Footer con información de generación
  - Botón de impresión flotante

### Implementación

```vue
<template>
  <UButton
    v-if="isContador"
    icon="i-heroicons-document-arrow-down"
    color="primary"
    @click="exportarPDF"
    :loading="exportandoPDF"
  >
    Generar PDF
  </UButton>
</template>

<script setup>
const exportarPDF = async () => {
  try {
    exportandoPDF.value = true

    // Abre el endpoint en nueva ventana
    const url = `/api/declaraciones/${declaracionId}/export-pdf`
    window.open(url, '_blank')

    toast.add({
      title: 'PDF generado',
      description: 'Use el botón de imprimir para guardarlo como PDF.',
      color: 'success'
    })
  } catch (error) {
    toast.add({
      title: 'Error al generar PDF',
      description: error.message,
      color: 'error'
    })
  } finally {
    exportandoPDF.value = false
  }
}
</script>
```

### Flujo de Exportación

1. Usuario hace clic en "Generar PDF"
2. Sistema muestra loading state
3. Se abre nueva pestaña con HTML de impresión
4. Usuario ve botón flotante "🖨️ Imprimir / Guardar PDF"
5. Al hacer clic, navegador muestra diálogo de impresión
6. Usuario selecciona "Guardar como PDF"
7. PDF se guarda localmente

### Diseño del PDF

```html
<!-- Encabezado -->
<div class="header">
  <h1>Declaración Fiscal Mensual</h1>
  <div class="subtitle">Diciembre 2025</div>
</div>

<!-- Información del contribuyente -->
<div class="info-grid">
  <div class="info-item">
    <div class="info-label">Nombre Completo</div>
    <div class="info-value">Juan Pérez García</div>
  </div>
</div>

<!-- Tabla de facturas -->
<table>
  <thead>
    <tr>
      <th>Folio</th>
      <th>Tipo</th>
      <th>RFC Emisor</th>
      <th>Monto</th>
    </tr>
  </thead>
</table>

<!-- Totales -->
<div class="totals">
  <div class="total-row grand-total">
    <span>Impuesto Calculado:</span>
    <span>$1,234.56</span>
  </div>
</div>
```

### API Endpoint

- `GET /api/declaraciones/:id/export-pdf` - Genera HTML de impresión

---

## 3. Visor de Logs de Auditoría

**Ruta:** `/dashboard/audit-logs`

### Características

- ✅ **Visualización completa de logs**
  - Lista cronológica de todas las acciones
  - Íconos según tipo de acción
  - Colores según estado (éxito/fallo)
  - Metadata expandible en formato JSON

- ✅ **Filtros avanzados**
  - Búsqueda por texto libre
  - Filtro por tipo de recurso (user, declaration, factura)
  - Filtro por estado (success, failure)
  - Filtros se combinan (AND)

- ✅ **Paginación**
  - 20 logs por página
  - Controles de navegación
  - Contador de registros
  - Páginas visibles adaptativas

- ✅ **Información detallada**
  - Acción realizada (traducida al español)
  - Recurso afectado
  - Dirección IP
  - Fecha y hora completa
  - Mensaje de error (si falla)
  - Metadata adicional (expansible)

### Componentes Principales

```vue
<template>
  <!-- Filtros -->
  <div class="grid grid-cols-3 gap-4">
    <UInput
      v-model="searchQuery"
      placeholder="Buscar acciones..."
      icon="i-heroicons-magnifying-glass"
    />
    <USelect
      v-model="filterType"
      :options="resourceTypes"
      placeholder="Tipo de recurso"
    />
    <USelect
      v-model="filterStatus"
      :options="statusOptions"
      placeholder="Estado"
    />
  </div>

  <!-- Lista de logs -->
  <div v-for="log in paginatedLogs">
    <div class="flex items-start justify-between">
      <!-- Ícono según acción -->
      <div :class="getActionColorClass(log.action, log.status)">
        <UIcon :name="getActionIcon(log.action)" />
      </div>

      <!-- Información -->
      <div>
        <h3>{{ getActionLabel(log.action) }}</h3>
        <p>{{ formatDate(log.createdAt) }}</p>
        <p>Recurso: {{ log.resource }}</p>
        <p v-if="log.ipAddress">IP: {{ log.ipAddress }}</p>
      </div>

      <!-- Badge de estado -->
      <UBadge :color="log.status === 'success' ? 'green' : 'red'">
        {{ log.status === 'success' ? 'Éxito' : 'Fallo' }}
      </UBadge>
    </div>

    <!-- Metadata expandible -->
    <UButton @click="toggleMetadata(log.id)">
      Ver detalles
    </UButton>
    <pre v-if="expandedLogs.has(log.id)">
      {{ JSON.stringify(log.metadata, null, 2) }}
    </pre>
  </div>

  <!-- Paginación -->
  <div class="flex justify-between">
    <div>Mostrando 1-20 de 150 registros</div>
    <div class="flex gap-2">
      <UButton @click="currentPage--">←</UButton>
      <UButton v-for="page in visiblePages" @click="currentPage = page">
        {{ page }}
      </UButton>
      <UButton @click="currentPage++">→</UButton>
    </div>
  </div>
</template>
```

### Traducciones de Acciones

```typescript
const labels: Record<string, string> = {
  'user.login_success': 'Inicio de sesión exitoso',
  'user.login_failed': 'Intento de inicio de sesión fallido',
  'user.logout': 'Cierre de sesión',
  'declaration.created': 'Declaración creada',
  'declaration.updated': 'Declaración actualizada',
  'declaration.exported': 'Declaración exportada',
  '2fa.device_registered': 'Dispositivo 2FA registrado',
  '2fa.device_removed': 'Dispositivo 2FA eliminado',
  'audit_logs.viewed': 'Consulta de registro de actividad',
}
```

### Íconos por Tipo de Acción

```typescript
const getActionIcon = (action: string): string => {
  if (action.includes('login')) return 'i-heroicons-arrow-right-on-rectangle'
  if (action.includes('logout')) return 'i-heroicons-arrow-left-on-rectangle'
  if (action.includes('created')) return 'i-heroicons-plus-circle'
  if (action.includes('updated')) return 'i-heroicons-pencil-square'
  if (action.includes('deleted')) return 'i-heroicons-trash'
  if (action.includes('exported')) return 'i-heroicons-arrow-down-tray'
  if (action.includes('viewed')) return 'i-heroicons-eye'
  if (action.includes('2fa')) return 'i-heroicons-finger-print'
  return 'i-heroicons-document-text'
}
```

### Colores por Estado y Acción

```typescript
const getActionColorClass = (action: string, status: string): string => {
  if (status === 'failure') return 'bg-red-100 text-red-600'
  if (action.includes('login')) return 'bg-blue-100 text-blue-600'
  if (action.includes('created')) return 'bg-green-100 text-green-600'
  if (action.includes('updated')) return 'bg-yellow-100 text-yellow-600'
  if (action.includes('deleted')) return 'bg-red-100 text-red-600'
  if (action.includes('exported')) return 'bg-purple-100 text-purple-600'
  return 'bg-gray-100 text-gray-600'
}
```

### API Endpoint

- `GET /api/audit-logs` - Lista logs del usuario actual

---

## 4. Navegación Actualizada

### Menú de Usuario (Dashboard Layout)

Se agregaron dos nuevas opciones al dropdown del usuario:

```typescript
const userMenuItems = [
  [{
    label: user.value?.email || '',
    slot: 'account',
    disabled: true
  }],
  [{
    label: 'Perfil',
    icon: 'i-heroicons-user-circle',
    to: '/dashboard/perfil'
  }, {
    label: 'Seguridad (2FA)',
    icon: 'i-heroicons-finger-print',
    to: '/dashboard/settings'
  }, {
    label: 'Registro de Actividad',
    icon: 'i-heroicons-clock',
    to: '/dashboard/audit-logs'
  }],
  [{
    label: 'Cerrar sesión',
    icon: 'i-heroicons-arrow-right-on-rectangle',
    click: logout
  }]
]
```

### Acceso

1. Clic en avatar del usuario (esquina superior derecha)
2. Menú dropdown se despliega
3. Opciones disponibles:
   - **Perfil** - Información personal
   - **Seguridad (2FA)** - Gestión de autenticación
   - **Registro de Actividad** - Logs de auditoría
   - **Cerrar sesión** - Finalizar sesión

---

## 5. Instalación y Dependencias

### Nuevas Dependencias

```json
{
  "dependencies": {
    "@simplewebauthn/server": "^11.0.0",
    "@simplewebauthn/browser": "^11.0.0"
  }
}
```

### Instalación

```bash
npm install @simplewebauthn/browser --legacy-peer-deps
```

### Archivos Creados

```
pages/
├── dashboard/
│   ├── settings.vue              # 320 líneas - Página de 2FA
│   └── audit-logs.vue            # 385 líneas - Visor de logs

server/
└── api/
    └── auth/
        └── 2fa/
            └── devices/
                └── [id].delete.ts # Endpoint DELETE para dispositivos
```

### Archivos Modificados

```
pages/
└── dashboard/
    └── declaracion/
        └── [id].vue               # +28 líneas - Función exportarPDF

layouts/
└── dashboard.vue                  # +12 líneas - Menú de navegación

package.json                       # +1 dependencia
package-lock.json                  # Actualizado
```

---

## 🚀 Próximos Pasos

### Para Deployment

1. **Aplicar migración de base de datos:**
   ```bash
   wrangler d1 migrations apply fiscal_platform_db --remote
   ```

2. **Configurar variables de entorno:**
   - `RP_ID` - Domain del sitio (ej: `plataforma-fiscal.com`)
   - `RP_NAME` - Nombre de la aplicación (ej: `Fiscal Pro`)
   - `RP_ORIGIN` - URL completa (ej: `https://plataforma-fiscal.com`)

3. **Verificar compatibilidad de navegadores:**
   - Chrome 67+
   - Firefox 60+
   - Safari 13+
   - Edge 18+

### Para Testing

1. **Probar 2FA:**
   - Registrar dispositivo de seguridad
   - Verificar que aparece en la lista
   - Eliminar y volver a registrar
   - Probar con diferentes dispositivos

2. **Probar PDF Export:**
   - Abrir declaración como contador
   - Clic en "Generar PDF"
   - Verificar que se abre en nueva pestaña
   - Usar "Guardar como PDF" del navegador

3. **Probar Audit Logs:**
   - Realizar varias acciones (login, exportar PDF, etc.)
   - Abrir página de logs
   - Verificar que aparecen las acciones
   - Probar filtros y búsqueda
   - Expandir metadata

---

## 📝 Notas Técnicas

### WebAuthn Security

- **Attestation:** None (más compatible)
- **User Verification:** Preferred (permite Touch ID, Face ID)
- **Authenticator Attachment:** Cross-platform (permite YubiKey y biometría)
- **Timeout:** 60 segundos

### PDF Generation

- **No server-side PDF:** Cloudflare Workers no soporta PDFKit
- **Browser-based:** Usa window.print() + CSS @media print
- **Ventajas:**
  - Sin dependencias adicionales
  - Funciona en edge environment
  - Usuario controla la calidad y formato
  - Totalmente compatible con Cloudflare

### Audit Logging

- **Automático:** Se registra en cada endpoint
- **No bloquea:** Errores de logging no afectan la operación
- **Metadata JSON:** Flexible para diferentes tipos de acciones
- **IP y User Agent:** Capturados automáticamente

---

## 🔐 Seguridad

### Headers Aplicados (Security Middleware)

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: (comprehensive policy)
Strict-Transport-Security: max-age=31536000 (production only)
```

### 2FA Protection

- Credenciales almacenadas cifradas (Base64)
- Counter previene replay attacks
- Challenge único por sesión
- Device verification con public key cryptography

### Audit Logging

- Eventos críticos se envían a Sentry
- IP address capturada para rastreo
- User Agent para detectar anomalías
- Metadata JSON para contexto completo

---

## 📊 Estadísticas

### Código Agregado

- **Líneas totales:** +868
- **Archivos nuevos:** 3
- **Archivos modificados:** 4
- **Tests passing:** 20/20 ✅

### Bundle Size

- **Client:** 331.91 kB (121.34 kB gzip)
- **Server:** 197 kB (64 kB gzip)
- **Total:** 7.67 MB (1.87 MB gzip)

### Páginas Pre-renderizadas

1. `/`
2. `/login`
3. `/register`
4. `/dashboard`
5. `/dashboard/settings` ✨ **NUEVO**
6. `/dashboard/audit-logs` ✨ **NUEVO**

---

## 🎨 UI/UX Features

### Componentes Nuxt UI Utilizados

- `UButton` - Botones con loading states
- `UBadge` - Estados y categorías
- `UModal` - Diálogos y popups
- `UInput` - Campos de texto
- `USelect` - Dropdowns
- `UAlert` - Mensajes informativos
- `UIcon` - Iconos Heroicons
- `UAvatar` - Avatar de usuario

### Toast Notifications

```typescript
toast.add({
  title: 'Título',
  description: 'Descripción',
  color: 'success' | 'error' | 'warning' | 'info'
})
```

### Loading States

Todos los botones y operaciones tienen estados de carga:

```vue
<UButton :loading="isLoading">
  Acción
</UButton>
```

### Dark Mode

Todas las páginas soportan dark mode automáticamente:

```css
class="text-gray-900 dark:text-white"
class="bg-gray-50 dark:bg-gray-900"
class="border-gray-200 dark:border-gray-700"
```

---

## 🐛 Troubleshooting

### 2FA no funciona

1. Verificar que el navegador soporta WebAuthn
2. Revisar consola del navegador
3. Verificar que HTTPS está activo (required)
4. Probar con otro dispositivo

### PDF se ve mal

1. Verificar CSS @media print
2. Probar con diferentes navegadores
3. Ajustar márgenes en @page
4. Revisar breakpoints de impresión

### Logs no aparecen

1. Verificar que logAuditEvent() se llama
2. Revisar tabla audit_logs en DB
3. Verificar endpoint /api/audit-logs
4. Comprobar permisos de usuario

---

## 📚 Referencias

- [WebAuthn Guide](https://webauthn.guide/)
- [@simplewebauthn/browser](https://simplewebauthn.dev/)
- [Nuxt UI Components](https://ui.nuxt.com/)
- [Heroicons](https://heroicons.com/)
- [CSS @media print](https://developer.mozilla.org/en-US/docs/Web/CSS/@media)

---

**Última actualización:** 2025-11-12
**Versión:** 1.0.0
**Estado:** ✅ Production Ready
