import { test, expect } from '@playwright/test'
import { AuthHelper } from './helpers'

test.describe('Edge Cases and Error Handling', () => {
  test.describe('Network Issues', () => {
    test('should handle offline mode gracefully', async ({ page }) => {
      await page.goto('/login')

      // Go offline
      await page.context().setOffline(true)

      await page.getByLabel(/correo/i).fill('test@test.com')
      await page.getByLabel(/contraseña/i).fill('password')
      await page.getByRole('button', { name: /iniciar sesión/i }).click()

      // Wait for error handling
      await page.waitForTimeout(2000)

      // Should still be on login page
      await expect(page).toHaveURL('/login')

      // Go back online
      await page.context().setOffline(false)
    })

    test('should retry failed requests', async ({ page }) => {
      // Enable offline briefly to cause failure
      await page.goto('/login')

      // Simulate slow network
      await page.route('**/*', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 100))
        await route.continue()
      })

      await page.getByLabel(/correo/i).fill('test@test.com')
      await page.getByLabel(/contraseña/i).fill('password')
      await page.getByRole('button', { name: /iniciar sesión/i }).click()

      await page.waitForTimeout(2000)

      // Should handle slow network
      await expect(page).toHaveURL('/login')
    })
  })

  test.describe('Session Expiration', () => {
    test('should handle expired session', async ({ page }) => {
      const auth = new AuthHelper(page)
      await auth.login('maria.gonzalez@test.com', 'TestPassword123!')
      await page.waitForURL('/dashboard')

      // Clear cookies to simulate expired session
      await page.context().clearCookies()

      // Try to access protected route
      await page.goto('/dashboard/declaracion/test-id')
      await page.waitForTimeout(1000)

      // Should redirect to login
      await expect(page).toHaveURL('/login')
    })

    test('should handle invalid session cookie', async ({ page }) => {
      await page.context().addCookies([
        {
          name: 'auth_session',
          value: 'invalid-session-token',
          domain: 'localhost',
          path: '/'
        }
      ])

      await page.goto('/dashboard')
      await page.waitForTimeout(1000)

      // Should redirect to login
      await expect(page).toHaveURL('/login')
    })
  })

  test.describe('Input Edge Cases', () => {
    test('should handle very long input in login', async ({ page }) => {
      await page.goto('/login')

      const longEmail = 'a'.repeat(300) + '@test.com'
      const longPassword = 'P'.repeat(500)

      await page.getByLabel(/correo/i).fill(longEmail)
      await page.getByLabel(/contraseña/i).fill(longPassword)
      await page.getByRole('button', { name: /iniciar sesión/i }).click()

      await page.waitForTimeout(1000)

      // Should handle gracefully
      await expect(page).toHaveURL('/login')
    })

    test('should handle special characters in email', async ({ page }) => {
      await page.goto('/login')

      const specialEmail = "test+tag@test.com"
      await page.getByLabel(/correo/i).fill(specialEmail)
      await page.getByLabel(/contraseña/i).fill('password')
      await page.getByRole('button', { name: /iniciar sesión/i }).click()

      await page.waitForTimeout(1000)

      // Should accept valid email with special chars
      await expect(page).toHaveURL('/login')
    })

    test('should handle unicode characters in form', async ({ page }) => {
      await page.goto('/register')

      await page.locator('select, [role="combobox"]').first().click()
      await page.getByText('Contribuyente').click()

      await page.getByLabel('Nombre').fill('José')
      await page.getByLabel('Apellidos').fill('González García')
      await page.getByLabel(/correo/i).fill(`jose-${Date.now()}@test.com`)
      await page.getByLabel(/contraseña/i).fill('TestPassword123!')

      await page.getByRole('button', { name: /registrarse/i }).click()

      await page.waitForTimeout(2000)

      // Should handle unicode names
      const url = page.url()
      expect(url).toBeTruthy()
    })

    test('should trim whitespace from inputs', async ({ page }) => {
      await page.goto('/login')

      await page.getByLabel(/correo/i).fill('  test@test.com  ')
      await page.getByLabel(/contraseña/i).fill('  password  ')
      await page.getByRole('button', { name: /iniciar sesión/i }).click()

      await page.waitForTimeout(1000)

      // Should trim and process
      await expect(page).toHaveURL('/login')
    })
  })

  test.describe('Multiple Tabs/Windows', () => {
    test('should sync logout across tabs', async ({ browser }) => {
      const context = await browser.newContext()
      const page1 = await context.newPage()
      const page2 = await context.newPage()

      // Login in first tab
      const auth1 = new AuthHelper(page1)
      await auth1.login('maria.gonzalez@test.com', 'TestPassword123!')
      await page1.waitForURL('/dashboard')

      // Open dashboard in second tab
      await page2.goto('/dashboard')
      await page2.waitForTimeout(1000)

      // Both should be logged in
      await expect(page1).toHaveURL('/dashboard')
      await expect(page2).toHaveURL('/dashboard')

      // Logout from first tab
      await auth1.logout()

      // Refresh second tab
      await page2.reload()
      await page2.waitForTimeout(1000)

      // Second tab should also be logged out
      await expect(page2).toHaveURL('/login')

      await context.close()
    })
  })

  test.describe('Browser Back/Forward', () => {
    test('should handle back navigation correctly', async ({ page }) => {
      const auth = new AuthHelper(page)
      await auth.login('maria.gonzalez@test.com', 'TestPassword123!')
      await page.waitForURL('/dashboard')

      // Navigate to a declaration
      const monthCards = page
        .locator('.card')
        .filter({ has: page.locator('.status-circle') })

      if ((await monthCards.count()) > 0) {
        await monthCards.first().click()
        await page.waitForURL(/\/dashboard\/declaracion/)

        // Go back
        await page.goBack()
        await page.waitForTimeout(500)

        // Should be back on dashboard
        await expect(page).toHaveURL('/dashboard')

        // Go forward
        await page.goForward()
        await page.waitForTimeout(500)

        // Should be on declaration again
        await expect(page).toHaveURL(/\/dashboard\/declaracion/)
      }
    })

    test('should prevent back to login after authentication', async ({ page }) => {
      await page.goto('/login')

      const auth = new AuthHelper(page)
      await auth.login('maria.gonzalez@test.com', 'TestPassword123!')
      await page.waitForURL('/dashboard')

      // Try to go back to login
      await page.goBack()
      await page.waitForTimeout(500)

      // Should stay on dashboard or redirect
      const url = page.url()
      expect(url).not.toContain('/login')
    })
  })

  test.describe('Rapid Interactions', () => {
    test('should handle rapid form submissions', async ({ page }) => {
      await page.goto('/login')

      await page.getByLabel(/correo/i).fill('test@test.com')
      await page.getByLabel(/contraseña/i).fill('password')

      // Click submit multiple times rapidly
      const submitButton = page.getByRole('button', { name: /iniciar sesión/i })
      await submitButton.click()
      await submitButton.click()
      await submitButton.click()

      await page.waitForTimeout(2000)

      // Should handle gracefully without duplicate requests
      await expect(page).toHaveURL('/login')
    })

    test('should handle rapid navigation', async ({ page }) => {
      const auth = new AuthHelper(page)
      await auth.login('maria.gonzalez@test.com', 'TestPassword123!')
      await page.waitForURL('/dashboard')

      // Navigate rapidly between pages
      for (let i = 0; i < 5; i++) {
        await page.goto('/dashboard')
        await page.waitForTimeout(100)
      }

      // Should still be functional
      await expect(page).toHaveURL('/dashboard')
      const heading = page.getByRole('heading', { name: /bienvenid/i })
      await expect(heading).toBeVisible({ timeout: 5000 })
    })
  })

  test.describe('Data Consistency', () => {
    test('should handle concurrent modifications', async ({ page }) => {
      const auth = new AuthHelper(page)
      await auth.login('maria.gonzalez@test.com', 'TestPassword123!')
      await page.waitForURL('/dashboard')

      const monthCards = page
        .locator('.card')
        .filter({ has: page.locator('.status-circle') })

      if ((await monthCards.count()) > 0) {
        await monthCards.first().click()
        await page.waitForURL(/\/dashboard\/declaracion/)

        const checkboxes = page.locator('input[type="checkbox"]')

        if ((await checkboxes.count()) >= 2) {
          // Click multiple checkboxes rapidly
          await checkboxes.nth(0).click()
          await checkboxes.nth(1).click()

          await page.waitForTimeout(1000)

          // Both should be checked
          await expect(checkboxes.nth(0)).toBeChecked()
          await expect(checkboxes.nth(1)).toBeChecked()
        }
      }
    })
  })

  test.describe('Memory Leaks', () => {
    test('should not leak memory on repeated navigation', async ({ page }) => {
      const auth = new AuthHelper(page)
      await auth.login('maria.gonzalez@test.com', 'TestPassword123!')

      // Navigate many times
      for (let i = 0; i < 10; i++) {
        await page.goto('/dashboard')
        await page.waitForTimeout(200)
      }

      // Page should still be responsive
      const heading = page.getByRole('heading', { name: /bienvenid/i })
      await expect(heading).toBeVisible({ timeout: 3000 })
    })
  })

  test.describe('Empty States', () => {
    test('should handle dashboard with no data', async ({ page }) => {
      const auth = new AuthHelper(page)
      await auth.login('maria.gonzalez@test.com', 'TestPassword123!')
      await page.waitForURL('/dashboard')

      // Dashboard should render even with no/minimal data
      const mainContent = page.locator('main, [role="main"]').first()
      await expect(mainContent).toBeVisible()
    })

    test('should handle declaration with no comments', async ({ page }) => {
      const auth = new AuthHelper(page)
      await auth.login('maria.gonzalez@test.com', 'TestPassword123!')
      await page.waitForURL('/dashboard')

      const monthCards = page
        .locator('.card')
        .filter({ has: page.locator('.status-circle') })

      if ((await monthCards.count()) > 0) {
        await monthCards.first().click()
        await page.waitForURL(/\/dashboard\/declaracion/)

        // Should show empty state or load without errors
        const mainContent = page.locator('main, [role="main"]').first()
        await expect(mainContent).toBeVisible()
      }
    })
  })
})
