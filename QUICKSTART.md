# 🚀 Quick Start Guide

Guía rápida para poner en marcha la Plataforma de Declaraciones Fiscales Colaborativas.

## ⚡ Inicio Rápido

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar entorno

```bash
cp .env.example .env
```

Edita `.env` y agrega:
```env
NUXT_SESSION_SECRET=tu-secret-generado
DATABASE_ID=tu-d1-database-id
KV_NAMESPACE=tu-kv-namespace-id
```

### 3. Iniciar desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

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
