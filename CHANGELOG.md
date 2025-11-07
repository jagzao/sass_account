# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [1.0.0] - 2025-11-07

### Agregado

#### Autenticación
- Sistema de autenticación con Lucia y D1 adapter
- Login y registro de usuarios
- Middleware de autenticación y autorización
- Soporte para dos roles: Contribuyente y Contador

#### Dashboards
- Dashboard para contribuyentes con vista de calendario
- Dashboard para contadores con lista de clientes
- Indicadores visuales de estado (verde, amarillo, rojo)
- Filtros y búsqueda de declaraciones

#### Declaraciones Mensuales
- Vista detallada por mes con información completa
- Barra de progreso de 4 pasos
- Checklists separados por rol
- Sistema de chat contextual
- Carga y gestión de facturas

#### Componentes UI
- StatusCircle: Indicadores de estado por color
- MonthCard: Tarjetas para vista de calendario
- ProgressBar: Barra de progreso con pasos
- UploadForm: Formulario de carga de facturas

#### Backend API
- Endpoints de autenticación (login, register, logout)
- CRUD de declaraciones mensuales
- Gestión de checklists
- Sistema de comentarios
- Gestión de facturas

#### Base de Datos
- Schema completo con Drizzle ORM
- Tablas: usuarios, sessions, declaraciones, facturas, checklist_items, comentarios, notificaciones
- Migraciones para D1

#### Configuración
- Setup completo de Nuxt 3 + TypeScript
- Configuración de Cloudflare Pages
- ESLint + Prettier
- Vitest para tests unitarios
- Playwright para tests E2E
- CI/CD con GitHub Actions

#### Documentación
- README completo con instrucciones de instalación
- Guía de contribución
- Changelog
- Licencia MIT

### Seguridad
- Contraseñas hasheadas con Argon2
- Sesiones encriptadas
- Validación de datos con Zod
- Middleware de autorización

## [Unreleased]

### Por Agregar
- Integración con buzón tributario del SAT
- Escaneo de tickets con OCR
- Exportación a PDF/Excel
- Notificaciones por email/WhatsApp
- Dashboard anual con gráficas
- Cálculo automático de impuestos
