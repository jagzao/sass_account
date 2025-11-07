# 📊 Plataforma de Declaraciones Fiscales Colaborativas

Una plataforma web moderna y eficiente para la gestión colaborativa de declaraciones fiscales mensuales entre contadores y contribuyentes.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Nuxt](https://img.shields.io/badge/Nuxt-3.x-00DC82.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## ✨ Características Principales

- 🔐 **Autenticación Segura** con Lucia y sesiones encriptadas
- 👥 **Dos Perfiles de Usuario**: Contribuyentes y Contadores
- 📅 **Vista de Calendario** con indicadores de estado mensual (verde, amarillo, rojo)
- ✅ **Checklists Personalizados** por rol con seguimiento de tareas
- 💬 **Sistema de Chat** contextual por declaración mensual
- 📁 **Carga de Facturas** con soporte para XML, PDF e imágenes
- 📸 **Escaneo de Tickets** con cámara (funcionalidad preparada)
- 📊 **Dashboard Intuitivo** para seguimiento de obligaciones fiscales
- 🌙 **Modo Oscuro** con diseño responsive
- ⚡ **Rendimiento Optimizado** con SSG + ISR/SWR
- 🔄 **Sincronización en Tiempo Real** del estado de declaraciones

## 🛠️ Stack Tecnológico

### Frontend
- **Framework**: Nuxt 3 + Vue 3 + TypeScript
- **UI Library**: Nuxt UI + TailwindCSS
- **State Management**: Pinia
- **Data Fetching**: TanStack Query (vue)
- **Validación**: Zod
- **Fonts**: Manrope (Google Fonts)

### Backend
- **Runtime**: Cloudflare Pages + Functions (Workers)
- **Base de Datos**: Cloudflare D1 (SQLite)
- **ORM**: Drizzle ORM
- **Autenticación**: Lucia (D1 adapter)
- **Cache**: Nitro cache + Cloudflare KV
- **Storage**: Cloudflare R2 (opcional)

### DevX / Testing
- **Unit Tests**: Vitest + @nuxt/test-utils
- **E2E Tests**: Playwright
- **Linting**: ESLint + Prettier
- **CI/CD**: GitHub Actions + Cloudflare Pages

## 📋 Requisitos Previos

- Node.js >= 18.0.0
- npm >= 9.0.0
- Cuenta de Cloudflare (para despliegue)

## 🚀 Instalación

### 1. Clonar el repositorio

```bash
git clone <repository-url>
cd plataforma-fiscal-colaborativa
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crea un archivo `.env` basado en `.env.example`:

```bash
cp .env.example .env
```

Edita el archivo `.env` con tus credenciales:

```env
# Session secret (genera uno con: openssl rand -base64 32)
NUXT_SESSION_SECRET=tu-secret-key-aqui

# Cloudflare D1 Database ID
DATABASE_ID=tu-d1-database-id

# Cloudflare KV Namespace ID
KV_NAMESPACE=tu-kv-namespace-id
```

### 4. Configurar Cloudflare (Desarrollo Local)

#### a. Instalar Wrangler CLI

```bash
npm install -g wrangler
```

#### b. Autenticarse con Cloudflare

```bash
wrangler login
```

#### c. Crear Base de Datos D1

```bash
wrangler d1 create fiscal_platform_db
```

Copia el `database_id` generado y actualiza tu archivo `wrangler.toml` y `.env`.

#### d. Crear Namespace KV

```bash
wrangler kv:namespace create KV
```

Copia el `id` generado y actualiza tu archivo `wrangler.toml` y `.env`.

#### e. Ejecutar Migraciones

```bash
npm run db:generate
npm run db:migrate
```

### 5. Iniciar el servidor de desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## 📁 Estructura del Proyecto

```
plataforma-fiscal-colaborativa/
├── assets/
│   └── css/
│       └── main.css                 # Estilos globales y Tailwind
├── components/
│   ├── auth/                        # Componentes de autenticación
│   ├── common/                      # Componentes reutilizables
│   │   ├── StatusCircle.vue
│   │   ├── MonthCard.vue
│   │   └── ProgressBar.vue
│   ├── dashboard/
│   │   ├── Contribuyente.vue        # Dashboard de contribuyente
│   │   └── Contador.vue             # Dashboard de contador
│   └── facturas/
│       └── UploadForm.vue           # Formulario de carga de facturas
├── composables/
│   ├── useAuth.ts                   # Composable de autenticación
│   └── useDeclaraciones.ts          # Composable de declaraciones
├── layouts/
│   ├── default.vue                  # Layout por defecto
│   ├── auth.vue                     # Layout de autenticación
│   └── dashboard.vue                # Layout del dashboard
├── middleware/
│   ├── auth.ts                      # Middleware de autenticación
│   └── guest.ts                     # Middleware para invitados
├── pages/
│   ├── index.vue                    # Página de inicio
│   ├── login.vue                    # Página de login
│   ├── register.vue                 # Página de registro
│   └── dashboard/
│       ├── index.vue                # Dashboard principal
│       └── declaracion/
│           └── [id].vue             # Detalle de declaración
├── server/
│   ├── api/
│   │   ├── auth/                    # Endpoints de autenticación
│   │   │   ├── login.post.ts
│   │   │   ├── register.post.ts
│   │   │   ├── logout.post.ts
│   │   │   └── me.get.ts
│   │   ├── declaraciones/           # Endpoints de declaraciones
│   │   │   ├── index.get.ts
│   │   │   ├── [id].get.ts
│   │   │   └── [id]/
│   │   │       ├── checklist.get.ts
│   │   │       └── comentarios.{get,post}.ts
│   │   └── facturas/
│   │       └── declaracion/
│   │           └── [id].get.ts
│   ├── db/
│   │   ├── schema.ts                # Schema de Drizzle ORM
│   │   ├── index.ts                 # Exportaciones DB
│   │   └── migrations/              # Migraciones SQL
│   ├── middleware/
│   │   └── auth.ts                  # Middleware de servidor
│   └── utils/
│       └── auth.ts                  # Utilidades de autenticación
├── types/
│   └── index.ts                     # Tipos TypeScript globales
├── tests/
│   ├── unit/                        # Tests unitarios
│   └── e2e/                         # Tests E2E
├── public/                          # Archivos estáticos
├── app.vue                          # App principal
├── nuxt.config.ts                   # Configuración de Nuxt
├── tailwind.config.ts               # Configuración de Tailwind
├── drizzle.config.ts                # Configuración de Drizzle
├── wrangler.toml                    # Configuración de Cloudflare
├── vitest.config.ts                 # Configuración de Vitest
├── playwright.config.ts             # Configuración de Playwright
├── eslint.config.mjs                # Configuración de ESLint
└── package.json
```

## 🗃️ Modelo de Datos

### Tablas Principales

- **usuarios**: Contadores y contribuyentes
- **sessions**: Sesiones de autenticación (Lucia)
- **declaraciones_mensuales**: Declaraciones por mes/año
- **facturas**: Documentos fiscales (XML, PDF, tickets)
- **checklist_items**: Tareas por declaración
- **comentarios**: Chat contextual por declaración
- **notificaciones**: Alertas y recordatorios

Ver schema completo en `server/db/schema.ts`

## 🎨 Componentes UI

### Indicadores de Estado

Los meses se visualizan con círculos de colores:

- 🟢 **Verde**: Declaración enviada y completa
- 🟡 **Amarillo**: En revisión o pendiente
- 🔴 **Rojo**: Incompleta o con problemas

### Barra de Progreso

Muestra 4 pasos del proceso:
1. Carga de facturas
2. Revisión por contador
3. Generación de declaración
4. Enviada al SAT

## 🔒 Seguridad

- Autenticación con Lucia y sesiones encriptadas
- Contraseñas hasheadas con Argon2
- Validación de datos con Zod
- Middleware de autorización por rol
- HTTPS obligatorio en producción
- Tokens de sesión con expiración

## 🧪 Testing

### Tests Unitarios

```bash
# Ejecutar tests
npm run test

# Ejecutar en modo watch
npm run test:watch

# Generar coverage
npm run test -- --coverage
```

### Tests E2E

```bash
npm run test:e2e
```

## 🚢 Despliegue en Cloudflare Pages

### 1. Conectar repositorio

1. Ve a [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navega a **Pages**
3. Crea un nuevo proyecto desde Git
4. Selecciona tu repositorio

### 2. Configurar build

- **Framework preset**: Nuxt.js
- **Build command**: `npm run build`
- **Build output directory**: `.output/public`

### 3. Variables de entorno

Configura las siguientes variables en el dashboard:

- `NUXT_SESSION_SECRET`
- `DATABASE_ID`
- `KV_NAMESPACE`

### 4. Bindings

Asegúrate de vincular:
- D1 Database: `DB`
- KV Namespace: `KV`
- R2 Bucket: `STORAGE` (opcional)

### 5. Deploy

```bash
npm run pages:deploy
```

## 📝 Scripts Disponibles

```bash
# Desarrollo
npm run dev                  # Iniciar servidor de desarrollo
npm run build                # Compilar para producción
npm run generate             # Generar sitio estático
npm run preview              # Preview de build de producción

# Base de Datos
npm run db:generate          # Generar migraciones
npm run db:migrate           # Ejecutar migraciones
npm run db:studio            # Abrir Drizzle Studio

# Testing
npm run test                 # Ejecutar tests unitarios
npm run test:watch           # Tests en modo watch
npm run test:e2e             # Ejecutar tests E2E

# Linting y Formato
npm run lint                 # Ejecutar ESLint
npm run lint:fix             # Corregir errores de ESLint
npm run format               # Formatear código con Prettier

# Deploy
npm run pages:deploy         # Desplegar a Cloudflare Pages
```

## 🎯 Roadmap

### Fase 1 - MVP (Completado ✅)
- [x] Sistema de autenticación
- [x] Dashboards para ambos roles
- [x] Vista de calendario mensual
- [x] Checklists por declaración
- [x] Sistema de comentarios
- [x] Carga de facturas

### Fase 2 - Mejoras
- [ ] Integración con buzón tributario del SAT
- [ ] Escaneo de tickets con OCR
- [ ] Exportación a PDF/Excel
- [ ] Notificaciones por email/WhatsApp
- [ ] Recordatorios automáticos
- [ ] Dashboard anual con gráficas

### Fase 3 - Avanzado
- [ ] Cálculo automático de impuestos
- [ ] Firma electrónica de documentos
- [ ] Integración con facturación electrónica
- [ ] API pública para integraciones
- [ ] App móvil nativa

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver archivo `LICENSE` para más detalles.

## 👨‍💻 Equipo

- **Producto**: Definición de requisitos y roadmap
- **UX/UI**: Diseño de interfaces y experiencia de usuario
- **Desarrollo**: Implementación técnica y arquitectura

## 📞 Soporte

Para reportar bugs o solicitar features, por favor abre un issue en GitHub.

## 🙏 Agradecimientos

- [Nuxt](https://nuxt.com/) - El framework Vue
- [Nuxt UI](https://ui.nuxt.com/) - Componentes UI
- [Cloudflare](https://cloudflare.com/) - Infraestructura
- [Drizzle ORM](https://orm.drizzle.team/) - ORM TypeScript-first
- [Lucia](https://lucia-auth.com/) - Autenticación simple

---

Hecho con ❤️ para simplificar la gestión fiscal colaborativa
