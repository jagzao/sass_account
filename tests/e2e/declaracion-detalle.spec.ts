import { test, expect } from '@playwright/test'
import { AuthHelper, DashboardHelper, DeclaracionHelper, testUsers } from './helpers'

test.describe('Declaración Mensual - Detalle', () => {
  let auth: AuthHelper
  let dashboard: DashboardHelper
  let declaracion: DeclaracionHelper

  test.describe('As Contribuyente', () => {
    test.beforeEach(async ({ page }) => {
      auth = new AuthHelper(page)
      dashboard = new DashboardHelper(page)
      declaracion = new DeclaracionHelper(page)

      // Login y navegar a una declaración
      await auth.login(testUsers.contribuyente.email, testUsers.contribuyente.password)
      await dashboard.waitForDashboard()

      // Click en el primer mes
      const monthCards = await dashboard.getMonthCards()
      if (await monthCards.count() > 0) {
        await monthCards.first().click()
        await declaracion.waitForDeclaracion()
      }
    })

    test.describe('Header and Basic Info', () => {
      test('should display month and year in header', async ({ page }) => {
        const header = page.locator('h1').first()
        await expect(header).toBeVisible()

        // Debe contener mes y año
        await expect(header).toContainText(/\d{4}/)

        const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

        let hasMonth = false
        const headerText = await header.textContent()
        for (const month of months) {
          if (headerText?.includes(month)) {
            hasMonth = true
            break
          }
        }

        expect(hasMonth).toBeTruthy()
      })

      test('should display status indicator', async ({ page }) => {
        const statusCircle = page.locator('.status-circle').first()
        await expect(statusCircle).toBeVisible()

        // Debe tener un estado visible
        await expect(page.locator('text=/pendiente|revisión|generada|enviada|incompleta/i')).toBeVisible()
      })

      test('should have back button', async ({ page }) => {
        const backButton = page.getByRole('button', { name: /volver/i })
        await expect(backButton).toBeVisible()
      })

      test('should navigate back to dashboard', async ({ page }) => {
        const backButton = page.getByRole('button', { name: /volver/i })
        await backButton.click()

        await expect(page).toHaveURL('/dashboard', { timeout: 5000 })
      })
    })

    test.describe('Progress Bar', () => {
      test('should display progress bar', async ({ page }) => {
        const progressText = page.locator('text=/paso \d+ de \d+/i')
        await expect(progressText).toBeVisible()
      })

      test('should show progress percentage', async ({ page }) => {
        const percentage = page.locator('text=/\d+%/')
        await expect(percentage).toBeVisible()
      })

      test('should display step labels', async ({ page }) => {
        // Verificar que existen las etiquetas de pasos
        const hasStepLabels =
          await page.getByText(/facturas/i).count() > 0 ||
          await page.getByText(/revisión/i).count() > 0 ||
          await page.getByText(/declaración/i).count() > 0 ||
          await page.getByText(/enviada/i).count() > 0

        expect(hasStepLabels).toBeTruthy()
      })

      test('should highlight completed steps', async ({ page }) => {
        // Los pasos completados deben tener un checkmark o estilo diferente
        const completedSteps = page.locator('[class*="completed"]').or(
          page.locator('svg').filter({ has: page.locator('path[d*="check"]') })
        )

        if (await completedSteps.count() > 0) {
          await expect(completedSteps.first()).toBeVisible()
        }
      })
    })

    test.describe('Checklists', () => {
      test('should display client checklist section', async ({ page }) => {
        const clientSection = page.locator('text=/tareas del cliente/i')
        await expect(clientSection).toBeVisible()
      })

      test('should display contador checklist section', async ({ page }) => {
        const contadorSection = page.locator('text=/tareas del contador/i')
        await expect(contadorSection).toBeVisible()
      })

      test('should show checklist items with checkboxes', async ({ page }) => {
        const checkboxes = page.locator('input[type="checkbox"]')
        await expect(checkboxes.first()).toBeVisible()
      })

      test('should toggle checklist item', async ({ page }) => {
        const checkboxes = page.locator('input[type="checkbox"]')

        if (await checkboxes.count() > 0) {
          const firstCheckbox = checkboxes.first()
          const initialState = await firstCheckbox.isChecked()

          await firstCheckbox.click()
          await page.waitForTimeout(500)

          const newState = await firstCheckbox.isChecked()
          expect(newState).not.toBe(initialState)
        }
      })

      test('should show completion date for completed items', async ({ page }) => {
        const completedItems = page.locator('text=/completado el/i')

        if (await completedItems.count() > 0) {
          await expect(completedItems.first()).toBeVisible()
        }
      })

      test('should expand/collapse checklist sections', async ({ page }) => {
        // Click en el header del accordion
        const clientHeader = page.locator('text=/tareas del cliente/i')
        await clientHeader.click()

        // Esperar animación
        await page.waitForTimeout(300)

        // Click de nuevo para colapsar
        await clientHeader.click()
        await page.waitForTimeout(300)
      })
    })

    test.describe('Facturas Section', () => {
      test('should display facturas section', async ({ page }) => {
        const facturasTitle = page.locator('text=/facturas y documentos/i')
        await expect(facturasTitle).toBeVisible()
      })

      test('should have upload button for contribuyente', async ({ page }) => {
        const uploadButton = page.getByRole('button', { name: /subir factura/i })
        await expect(uploadButton).toBeVisible()
      })

      test('should display list of facturas', async ({ page }) => {
        const facturas = await declaracion.getFacturas()

        if (await facturas.count() > 0) {
          await expect(facturas.first()).toBeVisible()
        }
      })

      test('should show factura details', async ({ page }) => {
        const facturas = await declaracion.getFacturas()

        if (await facturas.count() > 0) {
          const firstFactura = facturas.first()

          // Debe mostrar nombre de archivo
          await expect(firstFactura).toBeVisible()

          // Debe mostrar monto o fecha
          const hasMonto = await firstFactura.locator('text=/\$|MXN/').count() > 0
          const hasFecha = await firstFactura.locator('text=/\d{1,2}\/\d{1,2}\/\d{4}|\d{4}/').count() > 0

          expect(hasMonto || hasFecha).toBeTruthy()
        }
      })

      test('should show factura status badges', async ({ page }) => {
        const badges = page.locator('[class*="badge"]').or(
          page.locator('span').filter({ has: page.locator('text=/pendiente|revisada|aprobada|rechazada/i') })
        )

        if (await badges.count() > 0) {
          await expect(badges.first()).toBeVisible()
        }
      })

      test('should open upload modal', async ({ page }) => {
        const uploadButton = page.getByRole('button', { name: /subir factura/i })
        await uploadButton.click()

        // Debe abrir un modal
        await expect(page.locator('[role="dialog"]').or(page.locator('.modal'))).toBeVisible()
      })
    })

    test.describe('Comments Section', () => {
      test('should display comments section', async ({ page }) => {
        const commentsTitle = page.locator('text=/comentarios/i')
        await expect(commentsTitle).toBeVisible()
      })

      test('should show existing comments', async ({ page }) => {
        const comments = await declaracion.getComments()

        if (await comments.count() > 0) {
          await expect(comments.first()).toBeVisible()
        }
      })

      test('should display comment metadata', async ({ page }) => {
        const comments = await declaracion.getComments()

        if (await comments.count() > 0) {
          const firstComment = comments.first()

          // Debe mostrar avatar o nombre
          await expect(firstComment).toBeVisible()

          // Debe tener timestamp
          const hasTime = await firstComment.locator('text=/\d{1,2}:\d{2}|hace|ago/').count() > 0
          expect(hasTime).toBeTruthy()
        }
      })

      test('should have comment input', async ({ page }) => {
        const input = page.getByPlaceholder(/escribe un comentario/i)
        await expect(input).toBeVisible()
      })

      test('should send a comment', async ({ page }) => {
        const input = page.getByPlaceholder(/escribe un comentario/i)
        const submitButton = page.locator('button[type="submit"]').last()

        await input.fill('Este es un comentario de prueba')
        await submitButton.click()

        // Esperar que aparezca el nuevo comentario
        await page.waitForTimeout(1000)

        await expect(page.getByText('Este es un comentario de prueba')).toBeVisible()
      })

      test('should disable send button when input is empty', async ({ page }) => {
        const submitButton = page.locator('button[type="submit"]').last()
        const input = page.getByPlaceholder(/escribe un comentario/i)

        await input.clear()

        await expect(submitButton).toBeDisabled()
      })

      test('should show file attachments in comments', async ({ page }) => {
        const attachments = page.locator('svg').filter({ has: page.locator('path[d*="clip"]') })

        if (await attachments.count() > 0) {
          await expect(attachments.first()).toBeVisible()
        }
      })
    })

    test.describe('Responsive Design', () => {
      test('should adapt layout on mobile', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 })

        // Header debe ser visible
        await expect(page.locator('h1')).toBeVisible()

        // Progress bar debe adaptarse
        await expect(page.locator('text=/paso \d+/i')).toBeVisible()

        // Chat debe estar accesible
        await expect(page.getByPlaceholder(/escribe un comentario/i)).toBeVisible()
      })

      test('should stack columns on tablet', async ({ page }) => {
        await page.setViewportSize({ width: 768, height: 1024 })

        await expect(page.locator('h1')).toBeVisible()
        await expect(page.getByPlaceholder(/escribe un comentario/i)).toBeVisible()
      })
    })
  })

  test.describe('As Contador', () => {
    test.beforeEach(async ({ page }) => {
      auth = new AuthHelper(page)
      dashboard = new DashboardHelper(page)
      declaracion = new DeclaracionHelper(page)

      // Login como contador
      await auth.login(testUsers.contador.email, testUsers.contador.password)
      await dashboard.waitForDashboard()

      // Click en el primer cliente
      const clientCards = await dashboard.getClienteCards()
      if (await clientCards.count() > 0) {
        await clientCards.first().click()
        await declaracion.waitForDeclaracion()
      }
    })

    test('should have generate PDF button', async ({ page }) => {
      const pdfButton = page.getByRole('button', { name: /generar pdf/i })
      await expect(pdfButton).toBeVisible()
    })

    test('should not have upload factura button', async ({ page }) => {
      const uploadButton = page.getByRole('button', { name: /subir factura/i })
      await expect(uploadButton).not.toBeVisible()
    })

    test('should be able to check contador checklist items', async ({ page }) => {
      // Expandir sección de contador
      await page.locator('text=/tareas del contador/i').click()

      const contadorCheckboxes = page.locator('text=/tareas del contador/i')
        .locator('..').locator('input[type="checkbox"]')

      if (await contadorCheckboxes.count() > 0) {
        const firstCheckbox = contadorCheckboxes.first()
        await expect(firstCheckbox).toBeEnabled()
      }
    })

    test('should be able to review and approve facturas', async ({ page }) => {
      const facturas = await declaracion.getFacturas()

      if (await facturas.count() > 0) {
        // Debe poder ver las facturas
        await expect(facturas.first()).toBeVisible()

        // Debe haber botón de vista
        const viewButtons = page.locator('button').filter({ has: page.locator('svg') }).filter({ hasText: /^$/ })
        if (await viewButtons.count() > 0) {
          await expect(viewButtons.first()).toBeVisible()
        }
      }
    })
  })
})
