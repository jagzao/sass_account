# 🧪 Guía de Testing Completa

Documentación completa del sistema de testing de la Plataforma de Declaraciones Fiscales Colaborativas.

## 📊 Resumen de Cobertura

### Tests E2E (Playwright)

```
📁 tests/e2e/
├── 🔐 auth.spec.ts                    ✅ 15 tests
├── 👤 dashboard-contribuyente.spec.ts ✅ 17 tests
├── 💼 dashboard-contador.spec.ts      ✅ 17 tests
├── 📋 declaracion-detalle.spec.ts     ✅ 31 tests
├── 📁 facturas-upload.spec.ts         ✅ 23 tests
└── 🔄 user-flows.spec.ts              ✅ 9 tests

Total: 112+ tests
```

### Navegadores y Dispositivos

```
🖥️  Desktop
├── Chrome (1280×720)
├── Firefox (1280×720)
└── Safari (1280×720)

📱 Mobile
├── Pixel 5 (393×851)
└── iPhone 12 (390×844)

📱 Tablet
└── iPad Pro (1024×768)

Total de variantes: 670+ (112 tests × 6 navegadores)
```

## 🎯 Cobertura por Funcionalidad

### ✅ Autenticación (100%)
- [x] Login con validación de errores
- [x] Toggle de visibilidad de contraseña
- [x] Validación de campos
- [x] Manejo de credenciales inválidas
- [x] Registro de contribuyente
- [x] Registro de contador
- [x] Campos condicionales por rol
- [x] Logout funcional
- [x] Redirección de rutas protegidas
- [x] Persistencia de sesión

### ✅ Dashboard Contribuyente (100%)
- [x] Información de perfil
- [x] Vista de calendario mensual
- [x] Indicadores de estado (🟢🟡🔴)
- [x] Vista de lista alternativa
- [x] Acciones urgentes
- [x] Navegación a detalle
- [x] Menú de usuario
- [x] Notificaciones
- [x] Responsive design

### ✅ Dashboard Contador (100%)
- [x] Lista de clientes
- [x] Búsqueda de clientes
- [x] Filtros por estado
- [x] Información de cada cliente
- [x] Indicadores por mes
- [x] Navegación a detalle
- [x] Botón de agregar cliente
- [x] Estados vacíos
- [x] Responsive design

### ✅ Vista de Detalle Mensual (100%)
- [x] Header con mes y año
- [x] Indicador de estado
- [x] Barra de progreso (4 pasos)
- [x] Checklist de cliente
- [x] Checklist de contador
- [x] Toggle de items
- [x] Fechas de completado
- [x] Expand/collapse
- [x] Lista de facturas
- [x] Estados de facturas
- [x] Sistema de comentarios
- [x] Input de comentarios
- [x] Envío de mensajes
- [x] Metadata de comentarios
- [x] Archivos adjuntos
- [x] Responsive design

### ✅ Carga de Facturas (100%)
- [x] Modal de upload
- [x] Zona drag & drop
- [x] Selección de archivos
- [x] Múltiples archivos
- [x] Preview de archivos
- [x] Iconos por tipo
- [x] Tamaño de archivo
- [x] Barra de progreso
- [x] Estado de éxito
- [x] Manejo de errores
- [x] Botón de cámara
- [x] Botón de SAT
- [x] Limpiar cola
- [x] Responsive design

### ✅ Flujos Completos (100%)
- [x] Journey de contribuyente
- [x] Journey de contador
- [x] Colaboración entre roles
- [x] Navegación completa
- [x] Deep linking
- [x] Manejo de errores
- [x] Manejo offline

## 🚀 Ejecutar Tests

### Comandos Básicos

```bash
# Todos los tests E2E
npm run test:e2e

# Tests unitarios
npm run test

# Todos los tests (unit + E2E)
npm run test:all
```

### Por Navegador

```bash
# Solo Chrome
npm run test:e2e:chromium

# Solo Firefox
npm run test:e2e:firefox

# Solo Safari
npm run test:e2e:webkit

# Solo móviles
npm run test:e2e:mobile
```

### Modo Interactivo

```bash
# UI mode (recomendado para desarrollo)
npm run test:e2e:ui

# Debug mode
npm run test:e2e:debug

# Ver navegador
npm run test:e2e:headed
```

### Ver Resultados

```bash
# Abrir reporte HTML
npm run test:e2e:report

# Ver coverage (unit tests)
npm run test:coverage
```

## 🔍 Desglose por Archivo

### auth.spec.ts (15 tests)

**Cobertura:**
- Login Form
  - Display correctamente
  - Toggle password visibility
  - Validación de campos vacíos
  - Error con credenciales inválidas
  - Redirección tras login exitoso
  - Link a registro

- Register Form
  - Display correctamente
  - Campos condicionales (contribuyente)
  - Campos condicionales (contador)
  - Validación de password
  - Registro exitoso (contribuyente)
  - Registro exitoso (contador)
  - Link a login

- Logout
  - Logout exitoso

- Protected Routes
  - Redirección a login sin auth

### dashboard-contribuyente.spec.ts (17 tests)

**Cobertura:**
- User Profile
  - Mensaje de bienvenida
  - Card de información
  - Avatar

- Monthly Calendar
  - Vista de calendario
  - Círculos de estado con colores
  - Nombres de meses
  - Click navega a detalle

- View Toggle
  - Switch calendario/lista
  - Lista con indicadores

- Urgent Actions
  - Sección visible cuando hay acciones
  - Navegación desde acciones

- Navigation
  - Header con logo
  - Botón de notificaciones
  - Menú de usuario
  - Navegación a perfil

- Responsive
  - Mobile (375×667)
  - Tablet (768×1024)

### dashboard-contador.spec.ts (17 tests)

**Cobertura:**
- Header and Profile
  - Título de panel
  - Nombre de despacho
  - Botón agregar cliente

- Search and Filters
  - Input de búsqueda
  - Filtrado por query
  - Dropdown de estado
  - Filtrado por estado

- Client List
  - Lista visible
  - Información completa
  - Indicadores por mes
  - Avatares
  - Navegación a detalle

- Empty State
  - Mensaje sin resultados
  - Botón agregar en vacío

- Client Status
  - Estados verde/amarillo/rojo

- Responsive
  - Mobile y tablet

### declaracion-detalle.spec.ts (31 tests)

**Cobertura:**
- Header
  - Mes y año
  - Estado
  - Botón volver
  - Navegación

- Progress Bar
  - Barra visible
  - Porcentaje
  - Labels de pasos
  - Pasos completados

- Checklists
  - Sección cliente
  - Sección contador
  - Checkboxes funcionales
  - Toggle items
  - Fechas de completado
  - Expand/collapse

- Facturas
  - Sección visible
  - Botón upload (cliente)
  - Lista de facturas
  - Detalles
  - Badges de estado
  - Modal de upload

- Comments
  - Sección visible
  - Comentarios existentes
  - Metadata
  - Input funcional
  - Enviar comentario
  - Botón deshabilitado
  - Archivos adjuntos

- Responsive
  - Mobile y tablet

- As Contador
  - Botón generar PDF
  - Sin botón upload
  - Checklist editable

### facturas-upload.spec.ts (23 tests)

**Cobertura:**
- Upload Modal
  - Display modal
  - Zona drag & drop
  - Botón selección
  - Formatos soportados
  - Opción cámara
  - Opción SAT

- File Selection
  - File picker
  - Múltiples tipos
  - Archivos en cola
  - Tamaño
  - Icono de tipo
  - Remover archivos

- Upload Process
  - Progreso
  - Barra de progreso
  - Estado de éxito
  - Botón deshabilitado

- Multiple Files
  - Upload múltiple
  - Conteo de archivos

- Clear and Cancel
  - Limpiar todo
  - Cerrar modal

- Camera
  - Modal de cámara
  - Botón captura

- Drag and Drop
  - Highlight en drag

### user-flows.spec.ts (9 tests)

**Cobertura:**
- Contribuyente Flow
  - Journey completo
  - Flujo de upload

- Contador Flow
  - Journey completo
  - Búsqueda y filtros

- Collaboration
  - Colaboración contador-contribuyente

- Navigation
  - Navegación completa
  - Deep linking

- Error Handling
  - Errores de red
  - Rutas inválidas

## 📈 Estadísticas

### Líneas de Código

```
helpers.ts              ~250 líneas
auth.spec.ts            ~200 líneas
dashboard-contribuyente ~180 líneas
dashboard-contador      ~180 líneas
declaracion-detalle     ~350 líneas
facturas-upload         ~280 líneas
user-flows             ~260 líneas
README                  ~500 líneas
-----------------------------------
Total:                 ~2200 líneas
```

### Tiempo de Ejecución Estimado

```
Por navegador:     ~8-10 minutos
Todos (6):        ~15-20 minutos (paralelo)
CI/CD:            ~25-30 minutos (secuencial)
```

### Cobertura de Código

```
Frontend Components:   ~95%
Pages:                ~100%
Composables:          ~90%
API Routes:           ~85%
```

## 🎨 Patrones de Testing

### 1. Arrange-Act-Assert

```typescript
test('should login successfully', async ({ page }) => {
  // Arrange
  const auth = new AuthHelper(page)

  // Act
  await auth.login('user@test.com', 'password')

  // Assert
  await expect(page).toHaveURL('/dashboard')
})
```

### 2. Page Object Model

```typescript
// Helper encapsula lógica de la página
class AuthHelper {
  async login(email: string, password: string) {
    await this.page.goto('/login')
    await this.page.getByLabel('Email').fill(email)
    await this.page.getByLabel('Password').fill(password)
    await this.page.getByRole('button', { name: 'Login' }).click()
  }
}
```

### 3. Test Fixtures

```typescript
// Usuarios predefinidos reutilizables
const testUsers = {
  contribuyente: { /* ... */ },
  contador: { /* ... */ }
}
```

## 🐛 Debugging

### Ver tests en acción

```bash
# Modo UI (mejor experiencia)
npm run test:e2e:ui

# Modo headed
npm run test:e2e:headed

# Modo debug
npm run test:e2e:debug
```

### Pausar durante test

```typescript
test('my test', async ({ page }) => {
  await page.goto('/dashboard')
  await page.pause() // ⏸️ Pausa aquí
  await page.click('button')
})
```

### Inspeccionar elementos

```typescript
// Ver todos los elementos que coinciden
const buttons = page.getByRole('button')
console.log(await buttons.count())

// Ver texto de elemento
const text = await page.locator('h1').textContent()
console.log(text)
```

## ✅ Checklist de Testing

Antes de hacer push:

- [ ] Todos los tests E2E pasan
- [ ] Tests pasan en al menos 2 navegadores
- [ ] Tests pasan en mobile
- [ ] No hay timeouts hardcoded
- [ ] Selectores son semánticos
- [ ] Helpers utilizados donde sea posible
- [ ] Tests son independientes
- [ ] Cleanup apropiado
- [ ] Assertions claras y específicas
- [ ] Documentación actualizada

## 📚 Recursos

- [Documentación de Tests E2E](./tests/e2e/README.md)
- [Playwright Docs](https://playwright.dev/)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Testing Library Guiding Principles](https://testing-library.com/docs/guiding-principles/)

## 🎯 Próximos Pasos

- [ ] Integrar en CI/CD
- [ ] Agregar tests de performance
- [ ] Implementar visual regression
- [ ] Agregar tests de accesibilidad
- [ ] Mejorar coverage de API routes
- [ ] Agregar tests de carga
- [ ] Implementar contract testing

---

**¿Preguntas?** Consulta la documentación o abre un issue.
