# Tests E2E con Playwright

Documentación completa de los tests End-to-End de la Plataforma de Declaraciones Fiscales Colaborativas.

## 📋 Contenido

- [Estructura de Tests](#estructura-de-tests)
- [Ejecutar Tests](#ejecutar-tests)
- [Helpers y Fixtures](#helpers-y-fixtures)
- [Cobertura de Tests](#cobertura-de-tests)
- [Mejores Prácticas](#mejores-prácticas)

## 🗂️ Estructura de Tests

```
tests/e2e/
├── helpers.ts                      # Helpers y fixtures reutilizables
├── auth.spec.ts                    # Tests de autenticación
├── dashboard-contribuyente.spec.ts # Tests del dashboard de contribuyente
├── dashboard-contador.spec.ts      # Tests del dashboard de contador
├── declaracion-detalle.spec.ts     # Tests de vista de detalle mensual
├── facturas-upload.spec.ts         # Tests de carga de facturas
├── user-flows.spec.ts              # Tests de flujos completos
└── README.md                       # Este archivo
```

## 🚀 Ejecutar Tests

### Todos los tests

```bash
npm run test:e2e
```

### Tests específicos

```bash
# Solo tests de autenticación
npx playwright test auth

# Solo tests de contribuyente
npx playwright test dashboard-contribuyente

# Solo tests de contador
npx playwright test dashboard-contador

# Solo tests de declaraciones
npx playwright test declaracion-detalle

# Solo tests de upload
npx playwright test facturas-upload

# Solo tests de flujos completos
npx playwright test user-flows
```

### Por navegador

```bash
# Solo Chromium
npx playwright test --project=chromium

# Solo Firefox
npx playwright test --project=firefox

# Solo Safari
npx playwright test --project=webkit

# Solo Mobile
npx playwright test --project=mobile-chrome
npx playwright test --project=mobile-safari

# Solo Tablet
npx playwright test --project=tablet
```

### Modo Debug

```bash
# Abrir UI mode
npx playwright test --ui

# Modo debug
npx playwright test --debug

# Ejecutar con headed browser
npx playwright test --headed
```

### Ver resultados

```bash
# Abrir reporte HTML
npx playwright show-report

# Ver traces
npx playwright show-trace trace.zip
```

## 🛠️ Helpers y Fixtures

### AuthHelper

Maneja todas las operaciones de autenticación:

```typescript
const auth = new AuthHelper(page)

// Registrar usuario
await auth.register({
  email: 'test@test.com',
  password: 'password123',
  nombre: 'Test',
  apellidos: 'User',
  rol: 'contribuyente'
})

// Login
await auth.login('test@test.com', 'password123')

// Logout
await auth.logout()

// Verificar si está logueado
const isLoggedIn = await auth.isLoggedIn()
```

### DashboardHelper

Operaciones comunes en dashboards:

```typescript
const dashboard = new DashboardHelper(page)

// Esperar que cargue el dashboard
await dashboard.waitForDashboard()

// Obtener tarjetas de meses
const monthCards = await dashboard.getMonthCards()

// Click en un mes
await dashboard.clickMonth('Diciembre')

// Buscar clientes (contador)
await dashboard.searchClientes('Maria')

// Obtener tarjetas de clientes
const clientCards = await dashboard.getClienteCards()
```

### DeclaracionHelper

Operaciones en vista de declaración:

```typescript
const declaracion = new DeclaracionHelper(page)

// Esperar vista de declaración
await declaracion.waitForDeclaracion()

// Toggle checklist item
await declaracion.toggleChecklistItem('Subir facturas')

// Verificar si está completado
const isCompleted = await declaracion.isChecklistItemCompleted('Subir facturas')

// Enviar comentario
await declaracion.sendComment('Mi mensaje')

// Obtener comentarios
const comments = await declaracion.getComments()

// Abrir modal de upload
await declaracion.uploadFactura()

// Obtener facturas
const facturas = await declaracion.getFacturas()
```

### Test Users

Usuarios predefinidos para testing:

```typescript
import { testUsers } from './helpers'

// Contribuyente de prueba
testUsers.contribuyente
// {
//   email: 'maria.gonzalez@test.com',
//   password: 'TestPassword123!',
//   nombre: 'María',
//   apellidos: 'González López',
//   rol: 'contribuyente',
//   rfc: 'GOLM850123ABC',
//   regimenFiscal: 'Persona Física con Actividad Empresarial'
// }

// Contador de prueba
testUsers.contador
// {
//   email: 'juan.perez@test.com',
//   password: 'TestPassword456!',
//   nombre: 'Juan',
//   apellidos: 'Pérez Contador',
//   rol: 'contador',
//   despacho: 'Despacho Fiscal Pérez'
// }
```

## 📊 Cobertura de Tests

### Autenticación (auth.spec.ts)
- ✅ Formulario de login visible
- ✅ Toggle de visibilidad de contraseña
- ✅ Validación de campos vacíos
- ✅ Error con credenciales inválidas
- ✅ Redirección a dashboard tras login exitoso
- ✅ Link a página de registro
- ✅ Formulario de registro
- ✅ Campos condicionales por rol
- ✅ Validación de longitud de contraseña
- ✅ Registro exitoso de contribuyente
- ✅ Registro exitoso de contador
- ✅ Logout funcional
- ✅ Redirección de rutas protegidas

**Total: 15 tests**

### Dashboard Contribuyente (dashboard-contribuyente.spec.ts)
- ✅ Mensaje de bienvenida
- ✅ Información del perfil
- ✅ Avatar del usuario
- ✅ Vista de calendario
- ✅ Círculos de estado con colores
- ✅ Nombres de meses y años
- ✅ Click en mes navega a detalle
- ✅ Toggle entre vista calendario y lista
- ✅ Sección de acciones urgentes
- ✅ Navegación en acciones urgentes
- ✅ Header con logo
- ✅ Botón de notificaciones
- ✅ Menú de usuario dropdown
- ✅ Navegación a perfil
- ✅ Diseño responsive en mobile
- ✅ Diseño responsive en tablet
- ✅ Manejo de estados vacíos

**Total: 17 tests**

### Dashboard Contador (dashboard-contador.spec.ts)
- ✅ Título de panel de contador
- ✅ Nombre del despacho
- ✅ Botón de agregar cliente
- ✅ Input de búsqueda
- ✅ Filtrado de clientes por búsqueda
- ✅ Dropdown de filtro de estado
- ✅ Filtrado por estado
- ✅ Lista de clientes
- ✅ Información del cliente (RFC, email)
- ✅ Indicadores de estado por mes
- ✅ Avatares de clientes
- ✅ Navegación a detalle de cliente
- ✅ Estado vacío con mensaje
- ✅ Botón de agregar en estado vacío
- ✅ Identificación de estados (verde, amarillo, rojo)
- ✅ Modal de agregar cliente
- ✅ Diseño responsive

**Total: 17 tests**

### Declaración Detalle (declaracion-detalle.spec.ts)
- ✅ Header con mes y año
- ✅ Indicador de estado
- ✅ Botón de volver
- ✅ Navegación de regreso
- ✅ Barra de progreso
- ✅ Porcentaje de progreso
- ✅ Etiquetas de pasos
- ✅ Pasos completados destacados
- ✅ Sección de checklist cliente
- ✅ Sección de checklist contador
- ✅ Checkboxes de checklist
- ✅ Toggle de checklist items
- ✅ Fecha de completado
- ✅ Expand/collapse de checklists
- ✅ Sección de facturas
- ✅ Botón de upload (contribuyente)
- ✅ Lista de facturas
- ✅ Detalles de factura
- ✅ Badges de estado de factura
- ✅ Modal de upload
- ✅ Sección de comentarios
- ✅ Comentarios existentes
- ✅ Metadata de comentarios
- ✅ Input de comentario
- ✅ Enviar comentario
- ✅ Botón deshabilitado cuando vacío
- ✅ Archivos adjuntos
- ✅ Diseño responsive
- ✅ Botón de generar PDF (contador)
- ✅ Sin botón upload (contador)
- ✅ Checklist de contador editable

**Total: 31 tests**

### Upload de Facturas (facturas-upload.spec.ts)
- ✅ Modal de upload visible
- ✅ Zona de drag & drop
- ✅ Botón de selección
- ✅ Formatos soportados
- ✅ Opción de escaneo con cámara
- ✅ Opción de importar del SAT
- ✅ Abrir file picker
- ✅ Múltiples tipos de archivo
- ✅ Archivos en cola visible
- ✅ Tamaño de archivo
- ✅ Icono de tipo de archivo
- ✅ Remover archivos de cola
- ✅ Barra de progreso de subida
- ✅ Porcentaje de progreso
- ✅ Estado de éxito tras subida
- ✅ Botón deshabilitado durante subida
- ✅ Subir múltiples archivos
- ✅ Conteo de archivos seleccionados
- ✅ Limpiar todos los archivos
- ✅ Cerrar modal
- ✅ Modal de cámara
- ✅ Botón de captura en cámara
- ✅ Highlight en drag over

**Total: 23 tests**

### Flujos Completos (user-flows.spec.ts)
- ✅ Journey completo de contribuyente
- ✅ Flujo de carga de factura
- ✅ Journey completo de contador
- ✅ Búsqueda y filtros de clientes
- ✅ Colaboración contador-contribuyente
- ✅ Navegación entre secciones
- ✅ Manejo de deep linking
- ✅ Manejo de errores de red
- ✅ Manejo de rutas inválidas

**Total: 9 tests**

## 📈 Estadísticas Totales

- **Total de archivos de test:** 6
- **Total de tests:** 112+
- **Navegadores:** 6 (Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari, Tablet)
- **Total de variantes:** 670+ (112 tests × 6 navegadores)

## ✅ Mejores Prácticas

### 1. Usar Helpers

```typescript
// ❌ No hacer
await page.goto('/login')
await page.getByLabel('Email').fill('test@test.com')
await page.getByLabel('Password').fill('pass')
await page.getByRole('button', { name: 'Login' }).click()

// ✅ Hacer
const auth = new AuthHelper(page)
await auth.login('test@test.com', 'pass')
```

### 2. Esperar Correctamente

```typescript
// ❌ No usar timeouts fijos
await page.waitForTimeout(2000)

// ✅ Esperar por condiciones específicas
await page.waitForURL('/dashboard')
await page.waitForLoadState('networkidle')
await expect(element).toBeVisible()
```

### 3. Selectores Robustos

```typescript
// ❌ Selectores frágiles
await page.locator('.btn-primary').click()
await page.locator('#submit-123').click()

// ✅ Selectores semánticos
await page.getByRole('button', { name: 'Submit' }).click()
await page.getByLabel('Email').fill('test@test.com')
await page.getByText('Welcome').click()
```

### 4. Assertions Claras

```typescript
// ❌ Assertions vagas
expect(await page.locator('div').count()).toBeGreaterThan(0)

// ✅ Assertions específicas
await expect(page.getByText('Welcome, María')).toBeVisible()
await expect(page).toHaveURL('/dashboard')
```

### 5. Cleanup

```typescript
test.beforeEach(async ({ page }) => {
  // Setup
  const auth = new AuthHelper(page)
  await auth.login(user.email, user.password)
})

test.afterEach(async ({ page }) => {
  // Cleanup
  const auth = new AuthHelper(page)
  await auth.logout()
})
```

## 🐛 Debugging

### Ver tests en acción

```bash
# Modo headed
npx playwright test --headed

# Modo slow motion
npx playwright test --headed --slow-mo=1000
```

### Pausar ejecución

```typescript
test('my test', async ({ page }) => {
  await page.goto('/dashboard')
  await page.pause() // Pausa aquí
  await page.click('button')
})
```

### Ver traces

```bash
# Después de un test fallido
npx playwright show-trace test-results/.../trace.zip
```

### Screenshots

Los screenshots se guardan automáticamente en `test-results/` cuando un test falla.

## 📝 Agregar Nuevos Tests

### Template básico

```typescript
import { test, expect } from '@playwright/test'
import { AuthHelper, testUsers } from './helpers'

test.describe('Mi Nueva Feature', () => {
  test.beforeEach(async ({ page }) => {
    const auth = new AuthHelper(page)
    await auth.login(testUsers.contribuyente.email, testUsers.contribuyente.password)
  })

  test('should do something', async ({ page }) => {
    // Arrange
    await page.goto('/my-feature')

    // Act
    await page.getByRole('button', { name: 'Action' }).click()

    // Assert
    await expect(page.getByText('Success')).toBeVisible()
  })
})
```

## 🔄 CI/CD

Los tests se ejecutan automáticamente en GitHub Actions en cada push y pull request.

Ver configuración en: `.github/workflows/ci.yml`

## 📚 Recursos

- [Playwright Docs](https://playwright.dev/)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [API Reference](https://playwright.dev/docs/api/class-playwright)
- [Selectors Guide](https://playwright.dev/docs/selectors)

---

¿Preguntas? Abre un issue en GitHub.
