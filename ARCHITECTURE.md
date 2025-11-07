# 🏗️ Arquitectura Técnica

Documentación de la arquitectura de la Plataforma de Declaraciones Fiscales Colaborativas.

---

## 📐 Arquitectura General

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLOUDFLARE EDGE                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌──────────────┐    ┌─────────────┐       │
│  │   Nuxt 3    │───▶│  Cloudflare  │───▶│ Cloudflare  │       │
│  │  Frontend   │    │   Functions  │    │     D1      │       │
│  │   (SSG)     │    │  (Workers)   │    │  (SQLite)   │       │
│  └─────────────┘    └──────────────┘    └─────────────┘       │
│         │                   │                                   │
│         │                   │                                   │
│         ▼                   ▼                                   │
│  ┌─────────────┐    ┌──────────────┐    ┌─────────────┐       │
│  │  TailwindCSS│    │ Drizzle ORM  │    │     KV      │       │
│  │   Nuxt UI   │    │    + Zod     │    │   Cache     │       │
│  └─────────────┘    └──────────────┘    └─────────────┘       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │   User Browser   │
                    │  (Vue 3 + TS)    │
                    └──────────────────┘
```

---

## 🎨 Frontend Architecture

### Nuxt 3 + Vue 3 + TypeScript

```
app/
├── pages/                    # File-based routing
│   ├── index.vue            # Landing page (SSG)
│   ├── login.vue            # Login (SSG)
│   ├── register.vue         # Register (SSG)
│   └── dashboard/           # Protected routes (SPA)
│       ├── index.vue
│       └── declaracion/
│           └── [id].vue
│
├── components/              # Vue components
│   ├── auth/               # Auth-specific components
│   ├── common/             # Shared components
│   │   ├── StatusCircle.vue
│   │   ├── MonthCard.vue
│   │   └── ProgressBar.vue
│   ├── dashboard/          # Dashboard components
│   │   ├── Contribuyente.vue
│   │   └── Contador.vue
│   └── facturas/
│       └── UploadForm.vue
│
├── layouts/                # Layouts
│   ├── default.vue
│   ├── auth.vue
│   └── dashboard.vue
│
├── composables/            # Reusable composition functions
│   ├── useAuth.ts          # Authentication logic
│   └── useDeclaraciones.ts # Declarations logic
│
├── middleware/             # Route middleware
│   ├── auth.ts            # Protected routes
│   └── guest.ts           # Guest-only routes
│
└── types/                 # TypeScript types
    └── index.ts
```

### Rendering Strategy

```typescript
// nuxt.config.ts
routeRules: {
  '/': { prerender: true },              // SSG
  '/login': { prerender: true },         // SSG
  '/dashboard/**': { ssr: false },       // SPA
  '/api/**': { cors: true }              // API
}
```

**Explicación:**
- **Landing y Auth**: Pre-renderizadas (SSG) para SEO y performance
- **Dashboard**: SPA para interactividad y datos dinámicos
- **API**: CORS habilitado para desarrollo

### State Management

```typescript
// Pinia Store
stores/
├── auth.ts          # User authentication state
├── declaraciones.ts # Declarations state
└── ui.ts           # UI state (modals, sidebar, etc.)

// TanStack Query
plugins/
└── vue-query.ts    # Data fetching & caching
```

**Estrategia:**
- **Pinia**: Estado global de la aplicación
- **TanStack Query**: Fetching, caching y sincronización de datos del servidor

---

## 🔌 Backend Architecture

### Cloudflare Workers + D1

```
server/
├── api/                        # API endpoints
│   ├── auth/                   # Authentication
│   │   ├── login.post.ts
│   │   ├── register.post.ts
│   │   ├── logout.post.ts
│   │   └── me.get.ts
│   │
│   ├── declaraciones/          # Declarations
│   │   ├── index.get.ts
│   │   ├── [id].get.ts
│   │   └── [id]/
│   │       ├── checklist.get.ts
│   │       ├── comentarios.get.ts
│   │       └── comentarios.post.ts
│   │
│   └── facturas/               # Invoices
│       └── declaracion/
│           └── [id].get.ts
│
├── db/                         # Database layer
│   ├── schema.ts               # Drizzle schema
│   ├── index.ts                # DB instance
│   └── migrations/             # SQL migrations
│
├── middleware/                 # Server middleware
│   └── auth.ts                 # Session validation
│
└── utils/                      # Server utilities
    └── auth.ts                 # Lucia setup
```

### API Design Pattern

**RESTful + File-based routing:**

```typescript
// Ejemplo: server/api/declaraciones/[id].get.ts
export default defineEventHandler(async (event) => {
  // 1. Autenticación (automática via middleware)
  if (!event.context.user) {
    throw createError({ statusCode: 401 })
  }

  // 2. Validación de parámetros
  const declaracionId = getRouterParam(event, 'id')

  // 3. Lógica de negocio
  const declaracion = await db
    .select()
    .from(schema.declaracionesMensuales)
    .where(eq(schema.declaracionesMensuales.id, declaracionId))
    .get()

  // 4. Autorización
  if (declaracion.contribuyenteId !== event.context.user.id) {
    throw createError({ statusCode: 403 })
  }

  // 5. Respuesta
  return { declaracion }
})
```

**Patrón:**
1. Middleware de autenticación
2. Validación con Zod
3. Lógica de negocio con Drizzle
4. Autorización por rol
5. Respuesta tipada

---

## 🗄️ Database Architecture

### Drizzle ORM + D1 (SQLite)

```sql
-- Schema Overview
┌──────────────────┐
│    usuarios      │ ◄────┐
├──────────────────┤      │
│ id (PK)          │      │
│ email            │      │
│ hashedPassword   │      │
│ rol              │      │
│ ...              │      │
└──────────────────┘      │
         │                │
         │ 1:N            │ 1:N
         ▼                │
┌──────────────────┐      │
│   sessions       │      │
├──────────────────┤      │
│ id (PK)          │      │
│ userId (FK)      │──────┘
│ expiresAt        │
└──────────────────┘

┌──────────────────┐      ┌──────────────────┐
│ declaraciones_   │ 1:N  │  checklist_items │
│   mensuales      │─────▶├──────────────────┤
├──────────────────┤      │ declaracionId(FK)│
│ id (PK)          │      │ titulo           │
│ contribuyenteId  │      │ completado       │
│ contadorId       │      └──────────────────┘
│ mes, anio        │
│ estado           │      ┌──────────────────┐
│ colorEstado      │ 1:N  │   comentarios    │
│ ...              │─────▶├──────────────────┤
└──────────────────┘      │ declaracionId(FK)│
         │                │ usuarioId (FK)   │
         │ 1:N            │ mensaje          │
         ▼                └──────────────────┘
┌──────────────────┐
│    facturas      │      ┌──────────────────┐
├──────────────────┤      │ notificaciones   │
│ declaracionId(FK)│      ├──────────────────┤
│ nombreArchivo    │      │ usuarioId (FK)   │
│ archivoUrl       │      │ tipo             │
│ monto            │      │ mensaje          │
└──────────────────┘      └──────────────────┘
```

### Migrations

```typescript
// drizzle.config.ts
export default {
  schema: './server/db/schema.ts',
  out: './server/db/migrations',
  dialect: 'sqlite',
  driver: 'd1-http'
}
```

**Comandos:**
```bash
npm run db:generate   # Generar migraciones desde schema
npm run db:migrate    # Aplicar migraciones a D1
npm run db:studio     # Abrir Drizzle Studio
```

---

## 🔐 Authentication Flow

### Lucia + D1 Adapter

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ 1. POST /api/auth/login
       │    { email, password }
       ▼
┌─────────────────────────────┐
│  server/api/auth/login.ts   │
├─────────────────────────────┤
│ 1. Validate input (Zod)     │
│ 2. Query user (Drizzle)     │
│ 3. Verify password (Argon2) │
│ 4. Create session (Lucia)   │
│ 5. Set cookie                │
└──────┬──────────────────────┘
       │ 2. Set-Cookie: session_id
       ▼
┌─────────────┐
│   Browser   │  ◄── Session cookie stored
└─────────────┘

       │ 3. GET /api/declaraciones
       │    Cookie: session_id
       ▼
┌─────────────────────────────┐
│ server/middleware/auth.ts   │
├─────────────────────────────┤
│ 1. Read session cookie      │
│ 2. Validate session (Lucia) │
│ 3. Load user                │
│ 4. Attach to event.context  │
└──────┬──────────────────────┘
       │ event.context.user = { ... }
       ▼
┌─────────────────────────────┐
│ server/api/declaraciones    │
│   .get.ts                   │
├─────────────────────────────┤
│ 1. Check event.context.user │
│ 2. Query data               │
│ 3. Return response          │
└─────────────────────────────┘
```

**Seguridad:**
- Contraseñas hasheadas con Argon2 (memory-hard)
- Sesiones encriptadas con Lucia
- Cookies HttpOnly + Secure
- Validación en cada request
- Tokens con expiración

---

## 🎭 Component Patterns

### 1. Composition API

```vue
<script setup lang="ts">
// Imports
import { ref, computed } from 'vue'
import type { DeclaracionMensual } from '~/types'

// Props
const props = defineProps<{
  declaracion: DeclaracionMensual
}>()

// Emits
const emit = defineEmits<{
  update: [id: string]
}>()

// Composables
const { getMesNombre } = useDeclaraciones()

// State
const loading = ref(false)

// Computed
const mesNombre = computed(() => getMesNombre(props.declaracion.mes))

// Methods
const handleUpdate = async () => {
  loading.value = true
  emit('update', props.declaracion.id)
  loading.value = false
}
</script>
```

### 2. Helper Pattern

```typescript
// composables/useDeclaraciones.ts
export const useDeclaraciones = () => {
  // Encapsular lógica reutilizable
  const getMesNombre = (mes: number) => {
    const meses = ['Enero', 'Febrero', ...]
    return meses[mes - 1]
  }

  const getColorClass = (color: ColorEstado) => {
    const map = { verde: 'green', ... }
    return map[color]
  }

  return {
    getMesNombre,
    getColorClass
  }
}
```

### 3. Type-Safe API Calls

```typescript
// Tipos compartidos entre cliente y servidor
import type { DeclaracionMensual } from '~/types'

// Cliente
const { data } = await $fetch<{ declaracion: DeclaracionMensual }>(
  '/api/declaraciones/123'
)

// Servidor
export default defineEventHandler(async (event) => {
  const declaracion: DeclaracionMensual = await db...
  return { declaracion }
})
```

---

## 📦 Data Flow

### Fetch → Cache → Display

```
User Action
    ↓
┌────────────────┐
│  Vue Component │
└────────┬───────┘
         │ useQuery()
         ▼
┌────────────────┐
│ TanStack Query │ ◄──────┐
└────────┬───────┘        │
         │                │ Cached?
         │ No             │ Yes
         ▼                │
┌────────────────┐        │
│  $fetch API    │        │
└────────┬───────┘        │
         │                │
         ▼                │
┌────────────────┐        │
│ Cloudflare API │        │
│   (Workers)    │        │
└────────┬───────┘        │
         │                │
         ▼                │
┌────────────────┐        │
│   D1 Database  │        │
└────────┬───────┘        │
         │                │
         │ Response       │
         │ ───────────────┘
         ▼
┌────────────────┐
│  Vue Component │
│   (Display)    │
└────────────────┘
```

**Optimizaciones:**
1. TanStack Query caché en memoria
2. Cloudflare KV caché en edge
3. Nitro caché en runtime
4. D1 query optimizations

---

## 🧪 Testing Architecture

### Test Pyramid

```
        ┌─────────┐
        │   E2E   │ ◄─── 112+ tests (Playwright)
        │ 670+ var│
        └─────────┘
      ┌─────────────┐
      │ Integration │ ◄─── API + DB tests
      └─────────────┘
    ┌─────────────────┐
    │      Unit       │ ◄─── Composables + Utils
    └─────────────────┘
```

### E2E Test Structure

```
tests/e2e/
├── helpers.ts                 # Reutilizable helpers
│   ├── AuthHelper             # Login, register, logout
│   ├── DashboardHelper        # Dashboard operations
│   └── DeclaracionHelper      # Declaration operations
│
├── *.spec.ts                  # Test suites
│   ├── describe()             # Group tests
│   │   ├── beforeEach()       # Setup
│   │   ├── test()             # Individual test
│   │   └── afterEach()        # Cleanup
│   └── ...
│
└── playwright.config.ts       # Configuration
    ├── Projects (6)           # Chrome, Firefox, Safari, etc.
    ├── Reporters             # HTML, JSON, List
    └── WebServer             # Dev server config
```

---

## 🚀 Deployment Architecture

### Cloudflare Pages + D1

```
┌──────────────────────────────────────────┐
│           GitHub Repository              │
└─────────────┬────────────────────────────┘
              │ git push
              ▼
┌──────────────────────────────────────────┐
│         GitHub Actions (CI/CD)           │
├──────────────────────────────────────────┤
│  1. Run linting                          │
│  2. Run unit tests                       │
│  3. Run E2E tests                        │
│  4. Build Nuxt (npm run build)           │
└─────────────┬────────────────────────────┘
              │ on success
              ▼
┌──────────────────────────────────────────┐
│       Cloudflare Pages Build             │
├──────────────────────────────────────────┤
│  1. Install dependencies                 │
│  2. Run build                            │
│  3. Deploy to edge                       │
└─────────────┬────────────────────────────┘
              │
              ▼
┌──────────────────────────────────────────┐
│     Cloudflare Global Network            │
│                                          │
│  ┌────────┐  ┌────────┐  ┌────────┐    │
│  │  Edge  │  │  Edge  │  │  Edge  │    │
│  │   US   │  │   EU   │  │  APAC  │    │
│  └────────┘  └────────┘  └────────┘    │
│       │           │           │         │
│       └───────────┴───────────┘         │
│                   │                     │
│                   ▼                     │
│           ┌──────────────┐              │
│           │  D1 Database │              │
│           │   (Global)   │              │
│           └──────────────┘              │
│                                          │
└──────────────────────────────────────────┘
```

**Ventajas:**
- Deploy automático en git push
- CDN global (300+ ubicaciones)
- 0ms cold starts
- Escalabilidad automática
- SSL/TLS gratuito
- DDoS protection

---

## 📊 Performance Optimizations

### Frontend

1. **Code Splitting**
   ```typescript
   // Lazy loading de componentes
   const Modal = defineAsyncComponent(() => import('./Modal.vue'))
   ```

2. **Image Optimization**
   ```vue
   <NuxtImg
     src="/image.jpg"
     width="800"
     height="600"
     format="webp"
     loading="lazy"
   />
   ```

3. **Prefetching**
   ```typescript
   routeRules: {
     '/dashboard/**': {
       ssr: false,
       prefetch: true
     }
   }
   ```

### Backend

1. **Query Optimization**
   ```typescript
   // Drizzle con select específico
   const data = await db
     .select({
       id: schema.declaraciones.id,
       mes: schema.declaraciones.mes
       // Solo campos necesarios
     })
     .from(schema.declaraciones)
   ```

2. **Caching**
   ```typescript
   // KV Cache
   const cached = await event.context.cloudflare.env.KV.get('key')
   if (cached) return JSON.parse(cached)

   const data = await fetchFromDB()
   await event.context.cloudflare.env.KV.put('key', JSON.stringify(data))
   ```

3. **Connection Pooling**
   ```typescript
   // D1 maneja automáticamente
   // No requiere configuración manual
   ```

---

## 🔄 CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  lint:
    - npm run lint

  test:
    - npm run test

  build:
    - npm run build

  deploy:
    - wrangler pages deploy
```

**Stages:**
1. Lint → ESLint + Prettier
2. Test → Vitest (unit)
3. Build → Nuxt build
4. Deploy → Cloudflare Pages

---

## 📚 Referencias

- [Nuxt 3 Docs](https://nuxt.com)
- [Vue 3 Docs](https://vuejs.org)
- [Drizzle ORM](https://orm.drizzle.team)
- [Lucia Auth](https://lucia-auth.com)
- [Cloudflare Docs](https://developers.cloudflare.com)
- [Playwright](https://playwright.dev)

---

**Última actualización:** 2025-11-07
