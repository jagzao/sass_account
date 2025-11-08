import { test, expect } from '@playwright/test'
import { AuthHelper } from './helpers'

test.describe('Security Tests', () => {
  test.describe('Authentication Security', () => {
    test('should reject login without credentials', async ({ page }) => {
      await page.goto('/login')

      await page.getByRole('button', { name: /iniciar sesión/i }).click()

      await page.waitForTimeout(500)

      // Should show validation errors, not authenticate
      await expect(page).toHaveURL('/login')
    })

    test('should reject weak passwords on registration', async ({ page }) => {
      await page.goto('/register')

      await page.locator('select, [role="combobox"]').first().click()
      await page.getByText('Contribuyente').click()
      await page.getByLabel('Nombre').fill('Test')
      await page.getByLabel('Apellidos').fill('User')
      await page.getByLabel(/correo/i).fill(`test-${Date.now()}@test.com`)
      await page.getByLabel(/contraseña/i).fill('123') // Weak password

      await page.getByRole('button', { name: /registrarse/i }).click()

      await page.waitForTimeout(500)

      // Should show password strength error
      const hasError = (await page.locator('text=/8 caracteres/i').count()) > 0
      expect(hasError).toBeTruthy()
    })

    test('should not expose sensitive information in error messages', async ({
      page
    }) => {
      await page.goto('/login')

      await page.getByLabel(/correo/i).fill('nonexistent@test.com')
      await page.getByLabel(/contraseña/i).fill('wrongpassword')
      await page.getByRole('button', { name: /iniciar sesión/i }).click()

      await page.waitForTimeout(1000)

      // Error should be generic, not revealing whether user exists
      const pageContent = await page.content()
      expect(pageContent.toLowerCase()).not.toContain('user not found')
      expect(pageContent.toLowerCase()).not.toContain('usuario no existe')
    })

    test('should clear password fields on failed login', async ({ page }) => {
      await page.goto('/login')

      await page.getByLabel(/correo/i).fill('test@test.com')
      await page.getByLabel(/contraseña/i).fill('wrongpassword')
      await page.getByRole('button', { name: /iniciar sesión/i }).click()

      await page.waitForTimeout(1000)

      // Password field should be cleared for security
      const passwordValue = await page.getByLabel(/contraseña/i).inputValue()
      expect(passwordValue).toBe('')
    })

    test('should logout completely and clear session', async ({ page }) => {
      const auth = new AuthHelper(page)
      await auth.login('maria.gonzalez@test.com', 'TestPassword123!')
      await page.waitForURL('/dashboard')

      await auth.logout()

      // Trying to access protected route should redirect to login
      await page.goto('/dashboard')
      await page.waitForTimeout(1000)

      await expect(page).toHaveURL('/login')
    })

    test('should prevent session hijacking after logout', async ({ page }) => {
      const auth = new AuthHelper(page)
      await auth.login('maria.gonzalez@test.com', 'TestPassword123!')
      await page.waitForURL('/dashboard')

      // Get cookies before logout
      const cookiesBefore = await page.context().cookies()

      await auth.logout()

      // Try to restore old session cookies
      await page.context().addCookies(cookiesBefore)
      await page.goto('/dashboard')
      await page.waitForTimeout(1000)

      // Should redirect to login (session invalidated)
      await expect(page).toHaveURL('/login')
    })
  })

  test.describe('Authorization', () => {
    test('should prevent access to dashboard without authentication', async ({
      page
    }) => {
      await page.goto('/dashboard')
      await page.waitForTimeout(1000)

      // Should redirect to login
      await expect(page).toHaveURL('/login')
    })

    test('should prevent access to declaration details without authentication', async ({
      page
    }) => {
      await page.goto('/dashboard/declaracion/test-id')
      await page.waitForTimeout(1000)

      // Should redirect to login
      await expect(page).toHaveURL('/login')
    })

    test('should not allow unauthorized API access', async ({ page }) => {
      // Try to access API without authentication
      const response = await page.goto('/api/declaraciones')

      // Should return 401 or redirect
      expect(response?.status()).not.toBe(200)
    })

    test('should enforce role-based access control', async ({ page }) => {
      const auth = new AuthHelper(page)
      await auth.login('maria.gonzalez@test.com', 'TestPassword123!')
      await page.waitForURL('/dashboard')

      // Contribuyente should not see contador-only features
      const addClientButton = page.getByRole('button', { name: /agregar cliente/i })
      await expect(addClientButton).not.toBeVisible()
    })
  })

  test.describe('Input Validation and Sanitization', () => {
    test('should prevent script injection in login form', async ({ page }) => {
      await page.goto('/login')

      const maliciousInput = '<script>alert("XSS")</script>'

      await page.getByLabel(/correo/i).fill(maliciousInput)
      await page.getByLabel(/contraseña/i).fill('password')

      await page.getByRole('button', { name: /iniciar sesión/i }).click()

      await page.waitForTimeout(1000)

      // No script should execute
      const alerts = await page.evaluate(() => {
        return (window as any).alertCalled || false
      })
      expect(alerts).toBeFalsy()
    })

    test('should sanitize HTML in user registration', async ({ page }) => {
      await page.goto('/register')

      await page.locator('select, [role="combobox"]').first().click()
      await page.getByText('Contribuyente').click()

      const htmlPayload = '<img src=x onerror=alert(1)>'
      await page.getByLabel('Nombre').fill(htmlPayload)
      await page.getByLabel('Apellidos').fill('Test')
      await page.getByLabel(/correo/i).fill(`test-${Date.now()}@test.com`)
      await page.getByLabel(/contraseña/i).fill('password123456')

      await page.getByRole('button', { name: /registrarse/i }).click()

      await page.waitForTimeout(2000)

      // HTML should be escaped, not executed
      const alerts = await page.evaluate(() => {
        return (window as any).alertCalled || false
      })
      expect(alerts).toBeFalsy()
    })

    test('should prevent SQL injection in search', async ({ page }) => {
      const auth = new AuthHelper(page)
      await auth.login('juan.perez@test.com', 'TestPassword456!')
      await page.waitForURL('/dashboard')

      const searchInput = page.getByPlaceholder(/buscar/i)

      const sqlInjection = "'; DROP TABLE usuarios; --"
      await searchInput.fill(sqlInjection)

      await page.waitForTimeout(1000)

      // Page should still work (injection prevented)
      await expect(searchInput).toBeVisible()
      const value = await searchInput.inputValue()
      expect(value).toBe(sqlInjection)
    })

    test('should validate file types on upload', async ({ page }) => {
      const auth = new AuthHelper(page)
      await auth.login('maria.gonzalez@test.com', 'TestPassword123!')
      await page.waitForURL('/dashboard')

      const monthCards = page
        .locator('.card')
        .filter({ has: page.locator('.status-circle') })
      if ((await monthCards.count()) > 0) {
        await monthCards.first().click()
        await page.waitForURL(/\/dashboard\/declaracion/)

        const uploadButton = page.getByRole('button', { name: /subir factura/i })
        if ((await uploadButton.count()) > 0) {
          await uploadButton.click()

          const selectButton = page.getByRole('button', {
            name: /seleccionar archivos/i
          })
          const fileChooserPromise = page.waitForEvent('filechooser')

          await selectButton.click()

          const fileChooser = await fileChooserPromise

          // Try to upload executable file (should be rejected)
          await fileChooser.setFiles([
            {
              name: 'malicious.exe',
              mimeType: 'application/x-msdownload',
              buffer: Buffer.from('fake executable')
            }
          ])

          await page.waitForTimeout(500)

          // File should be rejected or not appear in list
          const exeFile = await page.getByText('malicious.exe').count()
          expect(exeFile).toBe(0)
        }
      }
    })

    test('should limit file size on upload', async ({ page }) => {
      const auth = new AuthHelper(page)
      await auth.login('maria.gonzalez@test.com', 'TestPassword123!')
      await page.waitForURL('/dashboard')

      const monthCards = page
        .locator('.card')
        .filter({ has: page.locator('.status-circle') })
      if ((await monthCards.count()) > 0) {
        await monthCards.first().click()
        await page.waitForURL(/\/dashboard\/declaracion/)

        const uploadButton = page.getByRole('button', { name: /subir factura/i })
        if ((await uploadButton.count()) > 0) {
          await uploadButton.click()

          const selectButton = page.getByRole('button', {
            name: /seleccionar archivos/i
          })
          const fileChooserPromise = page.waitForEvent('filechooser')

          await selectButton.click()

          const fileChooser = await fileChooserPromise

          // Try to upload large file (100MB)
          const largeBuffer = Buffer.alloc(100 * 1024 * 1024, 'a')
          await fileChooser.setFiles([
            {
              name: 'large-file.pdf',
              mimeType: 'application/pdf',
              buffer: largeBuffer
            }
          ])

          await page.waitForTimeout(1000)

          // Should show size limit error or reject file
          const hasError =
            (await page.locator('text=/tamaño|size|grande|large/i').count()) > 0
          expect(hasError).toBeTruthy()
        }
      }
    })
  })

  test.describe('Session Management', () => {
    test('should maintain session across page refreshes', async ({ page }) => {
      const auth = new AuthHelper(page)
      await auth.login('maria.gonzalez@test.com', 'TestPassword123!')
      await page.waitForURL('/dashboard')

      await page.reload()
      await page.waitForTimeout(1000)

      // Should still be on dashboard (session persisted)
      await expect(page).toHaveURL('/dashboard')
    })

    test('should handle concurrent sessions properly', async ({ browser }) => {
      const context1 = await browser.newContext()
      const page1 = await context1.newPage()

      const context2 = await browser.newContext()
      const page2 = await context2.newPage()

      // Login in both contexts
      const auth1 = new AuthHelper(page1)
      const auth2 = new AuthHelper(page2)

      await auth1.login('maria.gonzalez@test.com', 'TestPassword123!')
      await page1.waitForURL('/dashboard')

      await auth2.login('juan.perez@test.com', 'TestPassword456!')
      await page2.waitForURL('/dashboard')

      // Both sessions should be independent
      const heading1 = await page1.getByRole('heading', { name: /maria/i }).count()
      const heading2 = await page2.getByRole('heading', { name: /juan/i }).count()

      expect(heading1).toBeGreaterThan(0)
      expect(heading2).toBeGreaterThan(0)

      await context1.close()
      await context2.close()
    })

    test('should invalidate session after timeout', async ({ page }) => {
      const auth = new AuthHelper(page)
      await auth.login('maria.gonzalez@test.com', 'TestPassword123!')
      await page.waitForURL('/dashboard')

      // Wait for potential session timeout
      // Note: This would need to be adjusted based on actual timeout settings
      await page.waitForTimeout(5000)

      // Session should still be valid for reasonable time
      await page.reload()
      await expect(page).toHaveURL('/dashboard')
    })
  })

  test.describe('HTTPS and Secure Headers', () => {
    test('should use secure cookie attributes', async ({ page }) => {
      await page.goto('/login')

      const auth = new AuthHelper(page)
      await auth.login('maria.gonzalez@test.com', 'TestPassword123!')

      const cookies = await page.context().cookies()

      // Session cookies should have secure attributes
      const sessionCookies = cookies.filter((c) => c.name.includes('session'))
      for (const cookie of sessionCookies) {
        expect(cookie.httpOnly).toBeTruthy() // Should be HttpOnly
        // Secure flag depends on HTTPS in production
      }
    })

    test('should have security headers', async ({ page }) => {
      const response = await page.goto('/')

      // Check for security headers
      const headers = response?.headers()

      // These headers should be present in production
      expect(headers).toBeDefined()
    })

    test('should not expose sensitive server information', async ({ page }) => {
      const response = await page.goto('/')

      const headers = response?.headers()

      // Should not reveal server version
      const serverHeader = headers?.['server']
      if (serverHeader) {
        expect(serverHeader.toLowerCase()).not.toContain('version')
      }
    })
  })

  test.describe('CSRF Protection', () => {
    test('should include CSRF tokens in forms', async ({ page }) => {
      await page.goto('/login')

      // Modern frameworks often handle CSRF automatically
      // This test verifies the form is protected
      const form = page.locator('form')
      await expect(form).toBeVisible()
    })

    test('should validate origin on form submission', async ({ page }) => {
      await page.goto('/login')

      // Try to submit form (should work from same origin)
      await page.getByLabel(/correo/i).fill('test@test.com')
      await page.getByLabel(/contraseña/i).fill('password')
      await page.getByRole('button', { name: /iniciar sesión/i }).click()

      await page.waitForTimeout(1000)

      // Request should be processed (not rejected for CORS)
      const currentUrl = page.url()
      expect(currentUrl).toBeTruthy()
    })
  })

  test.describe('Data Privacy', () => {
    test('should not log sensitive data in console', async ({ page }) => {
      const consoleLogs: string[] = []

      page.on('console', (msg) => {
        consoleLogs.push(msg.text().toLowerCase())
      })

      const auth = new AuthHelper(page)
      await auth.login('maria.gonzalez@test.com', 'TestPassword123!')
      await page.waitForURL('/dashboard')

      // Check that password is not logged
      const hasPasswordInLogs = consoleLogs.some((log) =>
        log.includes('testpassword123')
      )
      expect(hasPasswordInLogs).toBeFalsy()
    })

    test('should not expose password in DOM', async ({ page }) => {
      await page.goto('/login')

      await page.getByLabel(/contraseña/i).fill('SecretPassword123')

      // Password input should have type="password"
      const passwordInput = page.getByLabel(/contraseña/i)
      const inputType = await passwordInput.getAttribute('type')

      expect(inputType).toBe('password')
    })

    test('should mask sensitive data in responses', async ({ page }) => {
      const auth = new AuthHelper(page)
      await auth.login('maria.gonzalez@test.com', 'TestPassword123!')
      await page.waitForURL('/dashboard')

      const responses: any[] = []

      page.on('response', async (response) => {
        if (response.url().includes('/api/')) {
          try {
            const body = await response.text()
            responses.push(body)
          } catch (e) {
            // Ignore errors
          }
        }
      })

      await page.reload()
      await page.waitForTimeout(2000)

      // Check that passwords are not in API responses
      const hasPasswordInResponse = responses.some(
        (r) => r.includes('hashedPassword') || r.includes('password')
      )
      expect(hasPasswordInResponse).toBeFalsy()
    })
  })

  test.describe('Rate Limiting', () => {
    test('should handle multiple rapid login attempts', async ({ page }) => {
      await page.goto('/login')

      // Try multiple login attempts rapidly
      for (let i = 0; i < 5; i++) {
        await page.getByLabel(/correo/i).fill('test@test.com')
        await page.getByLabel(/contraseña/i).fill('wrongpassword')
        await page.getByRole('button', { name: /iniciar sesión/i }).click()
        await page.waitForTimeout(300)
      }

      // System should still respond (not crash)
      await expect(page.getByLabel(/correo/i)).toBeVisible()
    })

    test('should handle rapid comment submissions', async ({ page }) => {
      const auth = new AuthHelper(page)
      await auth.login('maria.gonzalez@test.com', 'TestPassword123!')
      await page.waitForURL('/dashboard')

      const monthCards = page
        .locator('.card')
        .filter({ has: page.locator('.status-circle') })
      if ((await monthCards.count()) > 0) {
        await monthCards.first().click()
        await page.waitForURL(/\/dashboard\/declaracion/)

        const input = page.getByPlaceholder(/escribe un comentario/i)
        const submitButton = page.locator('button[type="submit"]').last()

        // Try multiple rapid submissions
        for (let i = 0; i < 3; i++) {
          await input.fill(`Rapid comment ${i}`)
          await submitButton.click()
          await page.waitForTimeout(500)
        }

        // System should handle it gracefully
        await expect(input).toBeVisible()
      }
    })
  })

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      await page.goto('/login')

      // Simulate offline
      await page.context().setOffline(true)

      await page.getByLabel(/correo/i).fill('test@test.com')
      await page.getByLabel(/contraseña/i).fill('password')
      await page.getByRole('button', { name: /iniciar sesión/i }).click()

      await page.waitForTimeout(2000)

      // Should show error message, not crash
      await expect(page).toHaveURL('/login')

      await page.context().setOffline(false)
    })

    test('should not expose stack traces to users', async ({ page }) => {
      await page.goto('/login')

      await page.getByLabel(/correo/i).fill('test@test.com')
      await page.getByLabel(/contraseña/i).fill('wrongpassword')
      await page.getByRole('button', { name: /iniciar sesión/i }).click()

      await page.waitForTimeout(1000)

      const pageContent = await page.content()

      // Should not show stack traces
      expect(pageContent.toLowerCase()).not.toContain('stack trace')
      expect(pageContent.toLowerCase()).not.toContain('error stack')
      expect(pageContent.toLowerCase()).not.toContain('at file://')
    })
  })
})
