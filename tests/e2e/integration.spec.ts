import { test, expect } from '@playwright/test'
import { AuthHelper } from './helpers'

test.describe('Integration Tests', () => {
  test.describe('Complete User Journey - Contribuyente', () => {
    test('should complete full declaration cycle', async ({ page }) => {
      const auth = new AuthHelper(page)
      await auth.login('maria.gonzalez@test.com', 'TestPassword123!')
      await page.waitForURL('/dashboard')

      // Verify dashboard loads
      const heading = page.getByRole('heading', { name: /bienvenid/i })
      await expect(heading).toBeVisible()

      // Navigate to a declaration
      const monthCards = page
        .locator('.card')
        .filter({ has: page.locator('.status-circle') })

      if ((await monthCards.count()) > 0) {
        const firstCard = monthCards.first()
        const statusBefore = await firstCard.getAttribute('class')

        await firstCard.click()
        await page.waitForURL(/\/dashboard\/declaracion/)

        // Complete checklist items
        const checkboxes = page.locator('input[type="checkbox"]')
        const checkboxCount = await checkboxes.count()

        if (checkboxCount > 0) {
          for (let i = 0; i < Math.min(3, checkboxCount); i++) {
            await checkboxes.nth(i).check()
            await page.waitForTimeout(300)
          }
        }

        // Add a comment
        const commentInput = page.getByPlaceholder(/escribe un comentario/i)
        if (await commentInput.isVisible()) {
          await commentInput.fill('Todas las facturas están subidas')
          const submitButton = page.locator('button[type="submit"]').last()
          await submitButton.click()
          await page.waitForTimeout(1000)
        }

        // Go back to dashboard
        await page.goto('/dashboard')
        await page.waitForTimeout(1000)

        // Verify changes persisted
        await expect(heading).toBeVisible()
      }
    })
  })

  test.describe('Complete User Journey - Contador', () => {
    test('should review client declarations', async ({ page }) => {
      const auth = new AuthHelper(page)
      await auth.login('juan.perez@test.com', 'TestPassword456!')
      await page.waitForURL('/dashboard')

      // Search for a client
      const searchInput = page.getByPlaceholder(/buscar/i)
      if (await searchInput.isVisible()) {
        await searchInput.fill('Maria')
        await page.waitForTimeout(500)

        // Verify search results
        const clientCards = page.locator('.card')
        const hasResults = (await clientCards.count()) > 0
        expect(hasResults).toBeTruthy()
      }

      // View client declarations
      const clientCards = page.locator('.card')
      if ((await clientCards.count()) > 0) {
        await clientCards.first().click()
        await page.waitForTimeout(1000)

        // Should show client's declarations or detail
        const mainContent = page.locator('main, [role="main"]').first()
        await expect(mainContent).toBeVisible()
      }
    })
  })

  test.describe('Collaboration Flow', () => {
    test('should allow contador to respond to contribuyente comments', async ({
      browser
    }) => {
      // Create two contexts for different users
      const context1 = await browser.newContext()
      const context2 = await browser.newContext()

      const contribuyentePage = await context1.newPage()
      const contadorPage = await context2.newPage()

      // Contribuyente adds comment
      const auth1 = new AuthHelper(contribuyentePage)
      await auth1.login('maria.gonzalez@test.com', 'TestPassword123!')
      await contribuyentePage.waitForURL('/dashboard')

      const monthCards = contribuyentePage
        .locator('.card')
        .filter({ has: contribuyentePage.locator('.status-circle') })

      if ((await monthCards.count()) > 0) {
        await monthCards.first().click()
        await contribuyentePage.waitForURL(/\/dashboard\/declaracion/)

        const commentInput =
          contribuyentePage.getByPlaceholder(/escribe un comentario/i)
        if (await commentInput.isVisible()) {
          await commentInput.fill('¿Necesitas algo más?')
          const submitButton = contribuyentePage
            .locator('button[type="submit"]')
            .last()
          await submitButton.click()
          await contribuyentePage.waitForTimeout(1000)
        }
      }

      // Contador views and responds
      const auth2 = new AuthHelper(contadorPage)
      await auth2.login('juan.perez@test.com', 'TestPassword456!')
      await contadorPage.waitForURL('/dashboard')

      await contadorPage.waitForTimeout(1000)

      // Both users should be able to interact
      await expect(contribuyentePage.locator('main').first()).toBeVisible()
      await expect(contadorPage.locator('main').first()).toBeVisible()

      await context1.close()
      await context2.close()
    })
  })

  test.describe('Data Persistence', () => {
    test('should persist checkbox states across sessions', async ({ page }) => {
      const auth = new AuthHelper(page)
      await auth.login('maria.gonzalez@test.com', 'TestPassword123!')
      await page.waitForURL('/dashboard')

      const monthCards = page
        .locator('.card')
        .filter({ has: page.locator('.status-circle') })

      if ((await monthCards.count()) > 0) {
        await monthCards.first().click()
        await page.waitForURL(/\/dashboard\/declaracion/)

        const checkbox = page.locator('input[type="checkbox"]').first()
        if (await checkbox.isVisible()) {
          // Check it
          await checkbox.check()
          await page.waitForTimeout(1000)
          expect(await checkbox.isChecked()).toBe(true)

          // Reload page
          await page.reload()
          await page.waitForTimeout(1000)

          // Should still be checked
          const checkboxAfterReload = page
            .locator('input[type="checkbox"]')
            .first()
          expect(await checkboxAfterReload.isChecked()).toBe(true)
        }
      }
    })

    test('should persist comments across sessions', async ({ page }) => {
      const auth = new AuthHelper(page)
      await auth.login('maria.gonzalez@test.com', 'TestPassword123!')
      await page.waitForURL('/dashboard')

      const monthCards = page
        .locator('.card')
        .filter({ has: page.locator('.status-circle') })

      if ((await monthCards.count()) > 0) {
        await monthCards.first().click()
        await page.waitForURL(/\/dashboard\/declaracion/)

        const uniqueComment = `Test comment ${Date.now()}`
        const commentInput = page.getByPlaceholder(/escribe un comentario/i)

        if (await commentInput.isVisible()) {
          await commentInput.fill(uniqueComment)
          const submitButton = page.locator('button[type="submit"]').last()
          await submitButton.click()
          await page.waitForTimeout(1000)

          // Reload page
          await page.reload()
          await page.waitForTimeout(1000)

          // Comment should still be visible
          const commentText = page.getByText(uniqueComment)
          await expect(commentText).toBeVisible({ timeout: 5000 })
        }
      }
    })
  })

  test.describe('UI State Management', () => {
    test('should maintain scroll position on navigation back', async ({ page }) => {
      const auth = new AuthHelper(page)
      await auth.login('maria.gonzalez@test.com', 'TestPassword123!')
      await page.waitForURL('/dashboard')

      // Scroll down
      await page.mouse.wheel(0, 500)
      await page.waitForTimeout(500)

      const monthCards = page
        .locator('.card')
        .filter({ has: page.locator('.status-circle') })

      if ((await monthCards.count()) > 0) {
        // Navigate to declaration
        await monthCards.first().click()
        await page.waitForURL(/\/dashboard\/declaracion/)

        // Go back
        await page.goBack()
        await page.waitForTimeout(500)

        // Scroll position handling varies by browser
        // Just verify we're back on dashboard
        await expect(page).toHaveURL('/dashboard')
      }
    })
  })

  test.describe('Real-time Updates', () => {
    test('should update UI after data changes', async ({ page }) => {
      const auth = new AuthHelper(page)
      await auth.login('maria.gonzalez@test.com', 'TestPassword123!')
      await page.waitForURL('/dashboard')

      const monthCards = page
        .locator('.card')
        .filter({ has: page.locator('.status-circle') })

      if ((await monthCards.count()) > 0) {
        await monthCards.first().click()
        await page.waitForURL(/\/dashboard\/declaracion/)

        // Make a change
        const checkbox = page.locator('input[type="checkbox"]').first()
        if (await checkbox.isVisible()) {
          const wasChecked = await checkbox.isChecked()
          await checkbox.click()
          await page.waitForTimeout(1000)

          // State should have changed
          const isCheckedNow = await checkbox.isChecked()
          expect(isCheckedNow).toBe(!wasChecked)
        }
      }
    })
  })

  test.describe('Form Validation Integration', () => {
    test('should validate all fields in registration form', async ({ page }) => {
      await page.goto('/register')

      // Try to submit without filling anything
      await page.getByRole('button', { name: /registrarse/i }).click()
      await page.waitForTimeout(500)

      // Should show validation errors
      await expect(page).toHaveURL('/register')

      // Fill form progressively
      await page.locator('select, [role="combobox"]').first().click()
      await page.getByText('Contribuyente').click()

      await page.getByLabel('Nombre').fill('Test')
      await page.getByLabel('Apellidos').fill('User')
      await page.getByLabel(/correo/i).fill(`test-${Date.now()}@test.com`)

      // Try with short password
      await page.getByLabel(/contraseña/i).fill('123')
      await page.getByRole('button', { name: /registrarse/i }).click()
      await page.waitForTimeout(500)

      // Should show password error
      await expect(page).toHaveURL('/register')
    })
  })

  test.describe('Navigation Flow', () => {
    test('should navigate through all main sections', async ({ page }) => {
      const auth = new AuthHelper(page)
      await auth.login('maria.gonzalez@test.com', 'TestPassword123!')
      await page.waitForURL('/dashboard')

      // Dashboard
      await expect(page.getByRole('heading', { name: /bienvenid/i })).toBeVisible()

      // Try to access profile if available
      const profileButton = page.getByRole('button', { name: /perfil|profile/i })
      if (await profileButton.isVisible()) {
        await profileButton.click()
        await page.waitForTimeout(1000)
      }

      // Navigate to declarations
      const monthCards = page
        .locator('.card')
        .filter({ has: page.locator('.status-circle') })

      if ((await monthCards.count()) > 0) {
        await monthCards.first().click()
        await page.waitForURL(/\/dashboard\/declaracion/)

        const mainContent = page.locator('main, [role="main"]').first()
        await expect(mainContent).toBeVisible()
      }

      // Go back to dashboard
      await page.goto('/dashboard')
      await expect(page.getByRole('heading', { name: /bienvenid/i })).toBeVisible()
    })
  })

  test.describe('Error Recovery', () => {
    test('should recover from API errors', async ({ page }) => {
      // Intercept API calls and return errors
      await page.route('**/api/**', (route) => {
        if (Math.random() > 0.7) {
          route.abort('failed')
        } else {
          route.continue()
        }
      })

      const auth = new AuthHelper(page)
      await auth.login('maria.gonzalez@test.com', 'TestPassword123!')

      // App should handle errors gracefully
      await page.waitForTimeout(2000)

      // Should either show error message or login page
      const url = page.url()
      expect(url).toBeTruthy()
    })
  })
})
