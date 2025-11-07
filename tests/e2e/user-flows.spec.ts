import { test, expect } from '@playwright/test'
import { AuthHelper, DashboardHelper, DeclaracionHelper, testUsers } from './helpers'

test.describe('Complete User Flows', () => {
  test.describe('Contribuyente Complete Flow', () => {
    test('should complete full contribuyente journey', async ({ page }) => {
      const auth = new AuthHelper(page)
      const dashboard = new DashboardHelper(page)
      const declaracion = new DeclaracionHelper(page)

      // 1. Register new contribuyente
      const uniqueEmail = `contrib-flow-${Date.now()}@test.com`
      await auth.register({
        ...testUsers.contribuyente,
        email: uniqueEmail
      })

      // 2. Should redirect to dashboard
      await expect(page).toHaveURL('/dashboard')
      await dashboard.waitForDashboard()

      // 3. View profile information
      await expect(page.locator('h1')).toContainText(/bienvenido/i)

      // 4. View monthly calendar
      const monthCards = await dashboard.getMonthCards()
      if (await monthCards.count() > 0) {
        // 5. Click on a month
        await monthCards.first().click()
        await declaracion.waitForDeclaracion()

        // 6. View declaration details
        await expect(page.locator('h1')).toBeVisible()
        await expect(page.locator('text=/paso \d+/i')).toBeVisible()

        // 7. Check a checklist item
        const checkboxes = page.locator('input[type="checkbox"]')
        if (await checkboxes.count() > 0) {
          await checkboxes.first().click()
          await page.waitForTimeout(500)
        }

        // 8. Send a comment
        await declaracion.sendComment('Tengo una duda sobre las deducciones')
        await page.waitForTimeout(1000)
        await expect(page.getByText('Tengo una duda sobre las deducciones')).toBeVisible()

        // 9. Go back to dashboard
        await page.getByRole('button', { name: /volver/i }).click()
        await expect(page).toHaveURL('/dashboard')

        // 10. Logout
        await auth.logout()
        await expect(page).toHaveURL('/login')
      }
    })

    test('should complete factura upload flow', async ({ page }) => {
      const auth = new AuthHelper(page)
      const dashboard = new DashboardHelper(page)
      const declaracion = new DeclaracionHelper(page)

      // Login
      await auth.login(testUsers.contribuyente.email, testUsers.contribuyente.password)
      await dashboard.waitForDashboard()

      // Navigate to declaration
      const monthCards = await dashboard.getMonthCards()
      if (await monthCards.count() > 0) {
        await monthCards.first().click()
        await declaracion.waitForDeclaracion()

        // Open upload modal
        await declaracion.uploadFactura()

        // Select file
        const buffer = Buffer.from('test factura content')
        const selectButton = page.getByRole('button', { name: /seleccionar archivos/i })
        const fileChooserPromise = page.waitForEvent('filechooser')
        await selectButton.click()

        const fileChooser = await fileChooserPromise
        await fileChooser.setFiles([{
          name: 'mi-factura.pdf',
          mimeType: 'application/pdf',
          buffer: buffer
        }])

        // Upload file
        await page.getByRole('button', { name: /subir archivos/i }).click()

        // Wait for success
        await expect(page.locator('text=/subido correctamente/i')).toBeVisible({ timeout: 10000 })

        // Close modal
        await page.getByRole('button', { name: /cerrar/i }).click()

        // Verify factura appears in list
        await expect(page.getByText('mi-factura.pdf')).toBeVisible()
      }
    })
  })

  test.describe('Contador Complete Flow', () => {
    test('should complete full contador journey', async ({ page }) => {
      const auth = new AuthHelper(page)
      const dashboard = new DashboardHelper(page)
      const declaracion = new DeclaracionHelper(page)

      // 1. Register new contador
      const uniqueEmail = `contador-flow-${Date.now()}@test.com`
      await auth.register({
        ...testUsers.contador,
        email: uniqueEmail
      })

      // 2. Should redirect to dashboard
      await expect(page).toHaveURL('/dashboard')
      await dashboard.waitForDashboard()

      // 3. View contador panel
      await expect(page.locator('h1')).toContainText(/panel de contador/i)

      // 4. View client list
      const clientCards = await dashboard.getClienteCards()
      if (await clientCards.count() > 0) {
        // 5. Click on a client
        await clientCards.first().click()
        await declaracion.waitForDeclaracion()

        // 6. View client's declaration
        await expect(page.locator('h1')).toBeVisible()

        // 7. Review checklist
        await page.locator('text=/tareas del contador/i').click()

        // 8. Mark contador task as complete
        const contadorCheckboxes = page.locator('input[type="checkbox"]')
        if (await contadorCheckboxes.count() > 0) {
          const unchecked = contadorCheckboxes.filter({ checked: false })
          if (await unchecked.count() > 0) {
            await unchecked.first().click()
            await page.waitForTimeout(500)
          }
        }

        // 9. Send comment to client
        await declaracion.sendComment('He revisado tus facturas, todo está correcto')
        await page.waitForTimeout(1000)

        // 10. Go back to client list
        await page.getByRole('button', { name: /volver/i }).click()
        await expect(page).toHaveURL('/dashboard')

        // 11. Logout
        await auth.logout()
        await expect(page).toHaveURL('/login')
      }
    })

    test('should search and filter clients', async ({ page }) => {
      const auth = new AuthHelper(page)
      const dashboard = new DashboardHelper(page)

      // Login
      await auth.login(testUsers.contador.email, testUsers.contador.password)
      await dashboard.waitForDashboard()

      // Search for client
      await dashboard.searchClientes('Maria')
      await page.waitForTimeout(500)

      // Verify results
      const clientCards = await dashboard.getClienteCards()
      if (await clientCards.count() > 0) {
        const firstCard = clientCards.first()
        const cardText = await firstCard.textContent()
        expect(cardText?.toLowerCase()).toContain('maria')
      }

      // Clear search
      await dashboard.searchClientes('')
      await page.waitForTimeout(500)

      // Filter by status
      await page.locator('select, [role="combobox"]').filter({ hasText: /todos|estado/i }).click()
      await page.getByText(/al corriente|verde/i).click()
      await page.waitForTimeout(500)

      // Verify filtered results have green status
      const greenCircles = page.locator('.status-circle.green')
      if (await greenCircles.count() > 0) {
        await expect(greenCircles.first()).toBeVisible()
      }
    })
  })

  test.describe('Cross-Role Collaboration', () => {
    test('should demonstrate contador-contribuyente collaboration', async ({ page, context }) => {
      // Este test simula la colaboración entre contador y contribuyente

      // 1. Contribuyente sube facturas
      const auth = new AuthHelper(page)
      const dashboard = new DashboardHelper(page)
      const declaracion = new DeclaracionHelper(page)

      await auth.login(testUsers.contribuyente.email, testUsers.contribuyente.password)
      await dashboard.waitForDashboard()

      const monthCards = await dashboard.getMonthCards()
      if (await monthCards.count() > 0) {
        await monthCards.first().click()
        await declaracion.waitForDeclaracion()

        // Complete client checklist
        const clientCheckboxes = page.locator('input[type="checkbox"]')
        if (await clientCheckboxes.count() > 0) {
          const unchecked = clientCheckboxes.filter({ checked: false })
          if (await unchecked.count() > 0) {
            await unchecked.first().click()
            await page.waitForTimeout(500)
          }
        }

        // Send message
        await declaracion.sendComment('He subido todas mis facturas del mes')
        await page.waitForTimeout(1000)

        // Logout
        await auth.logout()
      }

      // 2. Contador revisa y responde
      const contadorPage = await context.newPage()
      const authContador = new AuthHelper(contadorPage)
      const dashboardContador = new DashboardHelper(contadorPage)
      const declaracionContador = new DeclaracionHelper(contadorPage)

      await authContador.login(testUsers.contador.email, testUsers.contador.password)
      await dashboardContador.waitForDashboard()

      const clientCards = await dashboardContador.getClienteCards()
      if (await clientCards.count() > 0) {
        await clientCards.first().click()
        await declaracionContador.waitForDeclaracion()

        // View client's comment
        const comments = await declaracionContador.getComments()
        if (await comments.count() > 0) {
          // Should see client's message
          const hasClientMessage = await contadorPage.getByText('He subido todas mis facturas').count() > 0

          if (hasClientMessage) {
            // Respond
            await declaracionContador.sendComment('Perfecto, voy a revisarlas ahora')
            await contadorPage.waitForTimeout(1000)
          }
        }

        // Complete contador checklist
        await contadorPage.locator('text=/tareas del contador/i').click()
        const contadorCheckboxes = contadorPage.locator('input[type="checkbox"]')
        if (await contadorCheckboxes.count() > 0) {
          const unchecked = contadorCheckboxes.filter({ checked: false })
          if (await unchecked.count() > 0) {
            await unchecked.first().click()
          }
        }
      }

      await contadorPage.close()
    })
  })

  test.describe('Navigation Flows', () => {
    test('should navigate through all main sections', async ({ page }) => {
      const auth = new AuthHelper(page)
      const dashboard = new DashboardHelper(page)

      await auth.login(testUsers.contribuyente.email, testUsers.contribuyente.password)
      await dashboard.waitForDashboard()

      // 1. Dashboard
      await expect(page).toHaveURL('/dashboard')

      // 2. Navigate to declaration
      const monthCards = await dashboard.getMonthCards()
      if (await monthCards.count() > 0) {
        await monthCards.first().click()
        await expect(page).toHaveURL(/\/dashboard\/declaracion\/\w+/)

        // 3. Back to dashboard
        await page.getByRole('button', { name: /volver/i }).click()
        await expect(page).toHaveURL('/dashboard')

        // 4. Try to access profile
        await page.locator('[role="img"]').or(page.locator('img[alt*="avatar"]')).first().click()
        const perfilOption = page.getByText(/perfil/i)
        if (await perfilOption.count() > 0) {
          await perfilOption.click()
          await expect(page).toHaveURL(/\/dashboard\/perfil/)

          // Go back
          await page.goto('/dashboard')
        }
      }
    })

    test('should handle deep linking', async ({ page }) => {
      const auth = new AuthHelper(page)

      // Try to access declaration directly without login
      await page.goto('/dashboard/declaracion/test-id')

      // Should redirect to login
      await expect(page).toHaveURL('/login')

      // Login
      await auth.login(testUsers.contribuyente.email, testUsers.contribuyente.password)

      // Should redirect to dashboard (not the protected route)
      await expect(page).toHaveURL('/dashboard')
    })
  })

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      const auth = new AuthHelper(page)

      // Login first
      await auth.login(testUsers.contribuyente.email, testUsers.contribuyente.password)
      await expect(page).toHaveURL('/dashboard')

      // Simulate offline mode
      await page.context().setOffline(true)

      // Try to navigate
      const monthCards = await page.locator('.card').filter({ has: page.locator('.status-circle') })
      if (await monthCards.count() > 0) {
        await monthCards.first().click()

        // Should handle error
        await page.waitForTimeout(2000)
      }

      // Restore online
      await page.context().setOffline(false)
    })

    test('should handle invalid routes', async ({ page }) => {
      const auth = new AuthHelper(page)

      await auth.login(testUsers.contribuyente.email, testUsers.contribuyente.password)

      // Navigate to invalid route
      await page.goto('/dashboard/invalid-route-xyz')

      // Should show error or redirect
      await page.waitForTimeout(1000)
    })
  })
})
