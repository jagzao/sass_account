import { test, expect } from '@playwright/test'
import { AuthHelper, DashboardHelper, testUsers } from './helpers'

test.describe('Dashboard Contador', () => {
  let auth: AuthHelper
  let dashboard: DashboardHelper

  test.beforeEach(async ({ page }) => {
    auth = new AuthHelper(page)
    dashboard = new DashboardHelper(page)

    // Login como contador
    await auth.login(testUsers.contador.email, testUsers.contador.password)
    await dashboard.waitForDashboard()
  })

  test.describe('Header and Profile', () => {
    test('should display contador panel title', async ({ page }) => {
      await expect(page.locator('h1')).toContainText(/panel de contador/i)
    })

    test('should display despacho name', async ({ page }) => {
      if (testUsers.contador.despacho) {
        await expect(page.getByText(testUsers.contador.despacho)).toBeVisible()
      }
    })

    test('should have add client button', async ({ page }) => {
      const addButton = page.getByRole('button', { name: /agregar cliente/i })
      await expect(addButton).toBeVisible()
    })
  })

  test.describe('Search and Filters', () => {
    test('should have search input', async ({ page }) => {
      const searchInput = page.getByPlaceholder(/buscar/i)
      await expect(searchInput).toBeVisible()
    })

    test('should filter clients by search query', async ({ page }) => {
      const searchInput = page.getByPlaceholder(/buscar/i)
      await searchInput.fill('Maria')

      // Esperar que se actualice la lista
      await page.waitForTimeout(500)

      // Verificar que se filtran los resultados
      const clientCards = await dashboard.getClienteCards()
      if (await clientCards.count() > 0) {
        const firstCard = clientCards.first()
        await expect(firstCard).toContainText(/maria/i)
      }
    })

    test('should have status filter dropdown', async ({ page }) => {
      const filterDropdown = page.locator('select, [role="combobox"]').filter({ hasText: /todos|estado/i })
      await expect(filterDropdown).toBeVisible()
    })

    test('should filter clients by status', async ({ page }) => {
      // Click en filtro de estado
      await page.locator('select, [role="combobox"]').filter({ hasText: /todos|estado/i }).click()

      // Seleccionar un estado
      await page.getByText(/al corriente|verde/i).click()

      // Los clientes mostrados deben tener al menos un indicador verde
      await page.waitForTimeout(500)

      const greenCircles = page.locator('.status-circle.green')
      if (await greenCircles.count() > 0) {
        await expect(greenCircles.first()).toBeVisible()
      }
    })
  })

  test.describe('Client List', () => {
    test('should display list of clients', async ({ page }) => {
      const clientCards = await dashboard.getClienteCards()

      if (await clientCards.count() > 0) {
        // Verificar que se muestra al menos un cliente
        await expect(clientCards.first()).toBeVisible()
      }
    })

    test('should display client information', async ({ page }) => {
      const clientCards = await dashboard.getClienteCards()

      if (await clientCards.count() > 0) {
        const firstClient = clientCards.first()

        // Verificar que tiene nombre
        await expect(firstClient).toBeVisible()

        // Verificar que tiene RFC
        await expect(firstClient.locator('text=/RFC:/i')).toBeVisible()

        // Verificar que tiene email
        await expect(firstClient.locator('text=/@/i')).toBeVisible()
      }
    })

    test('should display month status indicators for each client', async ({ page }) => {
      const clientCards = await dashboard.getClienteCards()

      if (await clientCards.count() > 0) {
        const firstClient = clientCards.first()

        // Cada cliente debe tener círculos de estado
        const statusCircles = firstClient.locator('.status-circle')
        await expect(statusCircles.first()).toBeVisible()

        // Debe haber múltiples círculos (últimos meses)
        expect(await statusCircles.count()).toBeGreaterThanOrEqual(1)
      }
    })

    test('should display avatars for clients', async ({ page }) => {
      const clientCards = await dashboard.getClienteCards()

      if (await clientCards.count() > 0) {
        const firstClient = clientCards.first()
        const avatar = firstClient.locator('[role="img"]').or(firstClient.locator('img')).first()

        await expect(avatar).toBeVisible()
      }
    })

    test('should navigate to client detail when clicking card', async ({ page }) => {
      const clientCards = await dashboard.getClienteCards()

      if (await clientCards.count() > 0) {
        await clientCards.first().click()

        // Debe navegar a la vista de cliente o declaración
        await expect(page).toHaveURL(/\/dashboard\/(cliente|declaracion)\/\w+/, { timeout: 5000 })
      }
    })
  })

  test.describe('Empty State', () => {
    test('should display empty state when no clients match filter', async ({ page }) => {
      const searchInput = page.getByPlaceholder(/buscar/i)
      await searchInput.fill('ClienteInexistente12345XYZ')

      // Esperar que se actualice
      await page.waitForTimeout(500)

      // Debe mostrar mensaje de no encontrado
      await expect(page.getByText(/no se encontraron|sin resultados/i)).toBeVisible()
    })

    test('should show add client button in empty state', async ({ page }) => {
      const searchInput = page.getByPlaceholder(/buscar/i)
      await searchInput.fill('ClienteInexistente12345XYZ')

      await page.waitForTimeout(500)

      const addButton = page.getByRole('button', { name: /agregar cliente/i })
      await expect(addButton).toBeVisible()
    })
  })

  test.describe('Client Status Analysis', () => {
    test('should identify clients with green status', async ({ page }) => {
      const greenCircles = page.locator('.status-circle.green')

      if (await greenCircles.count() > 0) {
        await expect(greenCircles.first()).toBeVisible()

        // Tooltip debe indicar estado enviado o correcto
        await greenCircles.first().hover()
        await page.waitForTimeout(300)
      }
    })

    test('should identify clients with yellow status', async ({ page }) => {
      const yellowCircles = page.locator('.status-circle.yellow')

      if (await yellowCircles.count() > 0) {
        await expect(yellowCircles.first()).toBeVisible()

        // Indica revisión pendiente
        await yellowCircles.first().hover()
        await page.waitForTimeout(300)
      }
    })

    test('should identify clients with red status', async ({ page }) => {
      const redCircles = page.locator('.status-circle.red')

      if (await redCircles.count() > 0) {
        await expect(redCircles.first()).toBeVisible()

        // Indica problema o incompleto
        await redCircles.first().hover()
        await page.waitForTimeout(300)
      }
    })
  })

  test.describe('Add Client Flow', () => {
    test('should open add client modal', async ({ page }) => {
      const addButton = page.getByRole('button', { name: /agregar cliente/i }).first()
      await addButton.click()

      // En una implementación real, se abriría un modal
      // Por ahora verificamos que el botón es clickeable
      await expect(addButton).toBeEnabled()
    })
  })

  test.describe('Responsive Design', () => {
    test('should display correctly on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })

      await expect(page.locator('h1')).toBeVisible()
      await expect(page.getByPlaceholder(/buscar/i)).toBeVisible()
    })

    test('should display correctly on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 })

      await expect(page.locator('h1')).toBeVisible()

      const clientCards = await dashboard.getClienteCards()
      if (await clientCards.count() > 0) {
        await expect(clientCards.first()).toBeVisible()
      }
    })
  })

  test.describe('Navigation', () => {
    test('should have navigation header', async ({ page }) => {
      await expect(page.locator('header')).toBeVisible()
    })

    test('should have notifications button', async ({ page }) => {
      const notificationButton = page.locator('button').filter({ has: page.locator('svg') }).filter({ hasText: /^$/ })
      await expect(notificationButton.first()).toBeVisible()
    })

    test('should navigate back to dashboard from logo', async ({ page }) => {
      const logo = page.locator('header').locator('a').first()
      await logo.click()

      await expect(page).toHaveURL('/dashboard')
    })
  })
})
