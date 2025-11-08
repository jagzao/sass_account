# 🚀 Quick Start Guide

Guía rápida para poner en marcha la Plataforma de Declaraciones Fiscales Colaborativas.

---

## 🎯 Dos Caminos: Local o Cloudflare

### 🏠 Desarrollo Local (5 minutos)

```bash
# 1. Instalar dependencias
npm install

# 2. Instalar DB local
npm install --save-dev better-sqlite3 tsx nanoid

# 3. Configurar entorno
cp .env.example .env

# 4. Generar secret (copia el output)
openssl rand -base64 32

# 5. Editar .env y pegar el secret
nano .env  # O tu editor favorito

# 6. Crear DB local con datos de prueba
npm run db:seed

# 7. Iniciar servidor
npm run dev
```

**Abre:** [http://localhost:3000](http://localhost:3000)

**Login:**
- Contribuyente: `maria.gonzalez@test.com` / `TestPassword123!`
- Contador: `juan.perez@test.com` / `TestPassword456!`

---

### ☁️ Deploy a Cloudflare (Costo $0)

```bash
# 1. Instalar Wrangler CLI
npm install -g wrangler
wrangler login

# 2. Crear Database D1
wrangler d1 create fiscal_platform_db
# Copia el database_id y pégalo en wrangler.toml

# 3. Aplicar schema a D1
npm run db:generate
npm run d1:migrations

# 4. Build y Deploy
npm run pages:deploy

# 5. Configurar variables en Cloudflare Dashboard
# (Ver DEPLOYMENT.md para detalles)
```

**Tu app estará en:** `https://plataforma-fiscal.pages.dev`

📚 **Guía completa:** Ver [DEPLOYMENT.md](DEPLOYMENT.md)

## 📦 Estructura Básica

```
plataforma-fiscal-colaborativa/
├── pages/              # Páginas de la aplicación
│   ├── index.vue       # Landing page
│   ├── login.vue       # Inicio de sesión
│   └── dashboard/      # Dashboard principal
├── components/         # Componentes reutilizables
├── server/api/         # Backend API
├── composables/        # Lógica reutilizable
└── types/              # Tipos TypeScript
```

## 🎯 Flujo de Usuario

### Contribuyente
1. Registrarse como contribuyente
2. Ver calendario de declaraciones
3. Subir facturas por mes
4. Revisar checklist de tareas
5. Comentar con el contador

### Contador
1. Registrarse como contador
2. Ver lista de clientes
3. Revisar declaraciones pendientes
4. Marcar tareas completadas
5. Generar declaraciones

## 🔧 Comandos Útiles

```bash
# Desarrollo
npm run dev                 # Servidor de desarrollo

# Testing
npm run test               # Tests unitarios
npm run test:e2e           # Tests E2E

# Linting
npm run lint               # Verificar código
npm run lint:fix           # Corregir automáticamente

# Base de Datos
npm run db:generate        # Generar migraciones
npm run db:studio          # Abrir Drizzle Studio

# Build
npm run build              # Compilar para producción
npm run preview            # Preview de producción
```

## 📱 URLs Principales

- `/` - Landing page
- `/login` - Inicio de sesión
- `/register` - Registro
- `/dashboard` - Dashboard principal
- `/dashboard/declaracion/[id]` - Detalle de declaración

## 🎨 Temas de Color

- **Verde**: Todo correcto, declaración enviada
- **Amarillo**: En revisión, pendiente de acción
- **Rojo**: Incompleto, requiere atención urgente

## 📚 Próximos Pasos

1. Lee el [README.md](README.md) completo
2. Revisa [CONTRIBUTING.md](CONTRIBUTING.md) para contribuir
3. Consulta [CHANGELOG.md](CHANGELOG.md) para ver cambios

## 🆘 Ayuda

¿Problemas? Abre un issue en GitHub o consulta la documentación completa.

---

¡Disfruta desarrollando! 🎉
