import { test, expect } from '@playwright/test'
import { AuthHelper, DashboardHelper, testUsers } from './helpers'

test.describe('Dashboard Contribuyente', () => {
  let auth: AuthHelper
  let dashboard: DashboardHelper

  test.beforeEach(async ({ page }) => {
    auth = new AuthHelper(page)
    dashboard = new DashboardHelper(page)

    // Login como contribuyente
    await auth.login(testUsers.contribuyente.email, testUsers.contribuyente.password)
    await dashboard.waitForDashboard()
  })

  test.describe('User Profile Display', () => {
    test('should display user welcome message', async ({ page }) => {
      await expect(page.locator('h1')).toContainText(/bienvenido/i)
      await expect(page.locator('h1')).toContainText(testUsers.contribuyente.nombre)
    })

    test('should display user information card', async ({ page }) => {
      // Verificar que se muestra la información del usuario
      await expect(page.getByText(/RFC:/i)).toBeVisible()
      await expect(page.getByText(testUsers.contribuyente.email)).toBeVisible()
    })

    test('should display user avatar', async ({ page }) => {
      const avatar = page.locator('[role="img"]').or(page.locator('img[alt*="avatar"]')).first()
      await expect(avatar).toBeVisible()
    })
  })

  test.describe('Monthly Calendar View', () => {
    test('should display calendar view by default', async ({ page }) => {
      await expect(page.getByText(/mis declaraciones/i)).toBeVisible()

      // Verificar que hay tarjetas de meses
      const monthCards = await dashboard.getMonthCards()
      await expect(monthCards.first()).toBeVisible()
    })

    test('should display status circles with different colors', async ({ page }) => {
      const statusCircles = page.locator('.status-circle')
      await expect(statusCircles.first()).toBeVisible()

      // Verificar que existen círculos de diferentes colores
      const greenCircles = page.locator('.status-circle.green')
      const yellowCircles = page.locator('.status-circle.yellow')
      const redCircles = page.locator('.status-circle.red')

      const hasStatusCircles =
        await greenCircles.count() > 0 ||
        await yellowCircles.count() > 0 ||
        await redCircles.count() > 0

      expect(hasStatusCircles).toBeTruthy()
    })

    test('should display month names and years', async ({ page }) => {
      // Verificar que se muestran nombres de meses
      const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

      let hasMonth = false
      for (const month of months) {
        if (await page.getByText(month).count() > 0) {
          hasMonth = true
          break
        }
      }

      expect(hasMonth).toBeTruthy()
    })

    test('should click on month card and navigate to detail', async ({ page }) => {
      const firstCard = (await dashboard.getMonthCards()).first()
      await firstCard.click()

      // Debe navegar a la vista de detalle
      await expect(page).toHaveURL(/\/dashboard\/declaracion\/\w+/, { timeout: 5000 })
    })
  })

  test.describe('View Toggle', () => {
    test('should switch between calendar and list view', async ({ page }) => {
      // Click en selector de vista
      await page.locator('select, [role="combobox"]').filter({ hasText: /calendario|lista/i }).click()
      await page.getByText('Lista').click()

      // Verificar que cambia la vista
      await expect(page.locator('.border').filter({ has: page.locator('.status-circle') })).toBeVisible()
    })

    test('should display list view with status indicators', async ({ page }) => {
      // Cambiar a vista de lista
      await page.locator('select, [role="combobox"]').filter({ hasText: /calendario|lista/i }).click()
      await page.getByText('Lista').click()

      // Verificar elementos de lista
      const listItems = page.locator('.border').filter({ has: page.locator('.status-circle') })
      await expect(listItems.first()).toBeVisible()
    })
  })

  test.describe('Urgent Actions', () => {
    test('should display urgent actions section when available', async ({ page }) => {
      // Si hay acciones urgentes, deben mostrarse
      const urgentSection = page.locator('text=/acciones urgentes/i')

      if (await urgentSection.count() > 0) {
        await expect(urgentSection).toBeVisible()

        // Verificar que tiene el icono de alerta
        const alertIcon = page.locator('svg').filter({ has: page.locator('path[d*="exclamation"]') })
        await expect(alertIcon.first()).toBeVisible()
      }
    })

    test('should navigate to declaration when clicking urgent action', async ({ page }) => {
      const urgentSection = page.locator('text=/acciones urgentes/i')

      if (await urgentSection.count() > 0) {
        // Click en el botón "Ver" de una acción urgente
        await page.getByRole('button', { name: /ver/i }).first().click()

        // Debe navegar al detalle
        await expect(page).toHaveURL(/\/dashboard\/declaracion\/\w+/, { timeout: 5000 })
      }
    })
  })

  test.describe('Navigation', () => {
    test('should have navigation header with logo', async ({ page }) => {
      await expect(page.locator('header')).toBeVisible()
      await expect(page.locator('text=/fiscal/i').first()).toBeVisible()
    })

    test('should have notifications button', async ({ page }) => {
      const notificationButton = page.locator('button').filter({ has: page.locator('svg') }).filter({ hasText: /^$/ })
      await expect(notificationButton.first()).toBeVisible()
    })

    test('should have user menu dropdown', async ({ page }) => {
      // Click en avatar para abrir menu
      await page.locator('[role="img"]').or(page.locator('img[alt*="avatar"]')).first().click()

      // Verificar opciones del menu
      await expect(page.getByText(testUsers.contribuyente.email)).toBeVisible()
      await expect(page.getByText(/cerrar sesión/i)).toBeVisible()
    })

    test('should navigate to profile from user menu', async ({ page }) => {
      // Click en avatar
      await page.locator('[role="img"]').or(page.locator('img[alt*="avatar"]')).first().click()

      // Click en perfil
      const perfilOption = page.getByText(/perfil/i)
      if (await perfilOption.count() > 0) {
        await perfilOption.click()
        await expect(page).toHaveURL(/\/dashboard\/perfil/, { timeout: 5000 })
      }
    })
  })

  test.describe('Responsive Design', () => {
    test('should display correctly on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })

      // Verificar que el contenido es visible
      await expect(page.locator('h1')).toBeVisible()

      // Las tarjetas deben apilarse verticalmente
      const cards = await dashboard.getMonthCards()
      if (await cards.count() > 0) {
        await expect(cards.first()).toBeVisible()
      }
    })

    test('should display correctly on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 })

      await expect(page.locator('h1')).toBeVisible()
      const cards = await dashboard.getMonthCards()
      if (await cards.count() > 0) {
        await expect(cards.first()).toBeVisible()
      }
    })
  })

  test.describe('Empty States', () => {
    test('should handle no declarations gracefully', async ({ page }) => {
      // En caso de no tener declaraciones, debe mostrar un estado vacío apropiado
      const monthCards = await dashboard.getMonthCards()

      if (await monthCards.count() === 0) {
        // Verificar que hay algún mensaje indicando que no hay declaraciones
        await expect(page.getByText(/no hay|sin|vacío/i)).toBeVisible()
      }
    })
  })
})
