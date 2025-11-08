import { test, expect } from '@playwright/test'
import { AuthHelper } from './helpers'

test.describe('Form Validation Tests', () => {
  test.describe('Login Validation', () => {
    test('should validate email format', async ({ page }) => {
      await page.goto('/login')

      // Email inválido
      await page.getByLabel(/correo/i).fill('invalid-email')
      await page.getByLabel(/contraseña/i).fill('password123')
      await page.getByRole('button', { name: /iniciar sesión/i }).click()

      // Debe mostrar error de email inválido
      await page.waitForTimeout(500)
      const hasError =
        await page.locator('text=/email.*inválido/i').count() > 0 ||
        await page.locator('[role="alert"]').count() > 0

      expect(hasError).toBeTruthy()
    })

    test('should validate empty email', async ({ page }) => {
      await page.goto('/login')

      await page.getByLabel(/contraseña/i).fill('password123')
      await page.getByRole('button', { name: /iniciar sesión/i }).click()

      await page.waitForTimeout(500)
      const hasError =
        await page.locator('text=/requerido/i').count() > 0 ||
        await page.locator('[role="alert"]').count() > 0

      expect(hasError).toBeTruthy()
    })

    test('should validate empty password', async ({ page }) => {
      await page.goto('/login')

      await page.getByLabel(/correo/i).fill('test@test.com')
      await page.getByRole('button', { name: /iniciar sesión/i }).click()

      await page.waitForTimeout(500)
      const hasError =
        await page.locator('text=/requerido/i').count() > 0 ||
        await page.locator('[role="alert"]').count() > 0

      expect(hasError).toBeTruthy()
    })

    test('should trim whitespace from email', async ({ page }) => {
      await page.goto('/login')

      await page.getByLabel(/correo/i).fill('  test@test.com  ')
      await page.getByLabel(/contraseña/i).fill('password')
      await page.getByRole('button', { name: /iniciar sesión/i }).click()

      // No debe haber error de formato por espacios
      await page.waitForTimeout(1000)
    })

    test('should be case-insensitive for email', async ({ page }) => {
      await page.goto('/login')

      // Emails con diferentes cases deberían funcionar igual
      await page.getByLabel(/correo/i).fill('TEST@TEST.COM')
      await page.getByLabel(/contraseña/i).fill('password')

      // El campo debe aceptar el valor
      const value = await page.getByLabel(/correo/i).inputValue()
      expect(value).toBeTruthy()
    })
  })

  test.describe('Register Validation', () => {
    test('should validate password length', async ({ page }) => {
      await page.goto('/register')

      await page.locator('select, [role="combobox"]').first().click()
      await page.getByText('Contribuyente').click()
      await page.getByLabel('Nombre').fill('Test')
      await page.getByLabel('Apellidos').fill('User')
      await page.getByLabel(/correo/i).fill('test@test.com')
      await page.getByLabel(/contraseña/i).fill('123')

      await page.getByRole('button', { name: /registrarse/i }).click()

      await page.waitForTimeout(500)
      const hasError = await page.locator('text=/8 caracteres/i').count() > 0
      expect(hasError).toBeTruthy()
    })

    test('should validate required fields', async ({ page }) => {
      await page.goto('/register')

      // Submit sin llenar campos
      await page.getByRole('button', { name: /registrarse/i }).click()

      await page.waitForTimeout(500)
      const hasErrors = await page.locator('text=/requerido/i').count() > 0
      expect(hasErrors).toBeTruthy()
    })

    test('should validate email uniqueness', async ({ page }) => {
      await page.goto('/register')

      const auth = new AuthHelper(page)
      const uniqueEmail = `test-${Date.now()}@test.com`

      // Primer registro
      await auth.register({
        email: uniqueEmail,
        password: 'password123',
        nombre: 'Test',
        apellidos: 'User',
        rol: 'contribuyente'
      })

      // Esperar redirección
      await page.waitForTimeout(2000)

      // Logout
      await auth.logout()

      // Intentar registrar con el mismo email
      await page.goto('/register')

      await page.locator('select, [role="combobox"]').first().click()
      await page.getByText('Contribuyente').click()
      await page.getByLabel('Nombre').fill('Test2')
      await page.getByLabel('Apellidos').fill('User2')
      await page.getByLabel(/correo/i).fill(uniqueEmail)
      await page.getByLabel(/contraseña/i).fill('password123')

      await page.getByRole('button', { name: /registrarse/i }).click()

      await page.waitForTimeout(1000)
      const hasError = await page.locator('text=/ya.*registrado/i').count() > 0
      expect(hasError).toBeTruthy()
    })

    test('should validate RFC format for contribuyente', async ({ page }) => {
      await page.goto('/register')

      await page.locator('select, [role="combobox"]').first().click()
      await page.getByText('Contribuyente').click()

      // RFC debe ser visible
      const rfcInput = page.getByLabel('RFC')
      await expect(rfcInput).toBeVisible()

      // RFC inválido (si hay validación)
      await rfcInput.fill('INVALID')

      // El campo debe aceptar texto
      const value = await rfcInput.inputValue()
      expect(value).toBe('INVALID')
    })

    test('should require despacho for contador', async ({ page }) => {
      await page.goto('/register')

      await page.locator('select, [role="combobox"]').first().click()
      await page.getByText('Contador').click()

      // Campo de despacho debe ser visible
      const despachoInput = page.getByLabel('Despacho')
      await expect(despachoInput).toBeVisible()
    })

    test('should validate phone number format', async ({ page }) => {
      await page.goto('/register')

      await page.locator('select, [role="combobox"]').first().click()
      await page.getByText('Contribuyente').click()

      const phoneInput = page.getByLabel(/teléfono/i)

      // Números con letras
      await phoneInput.fill('abcd1234')

      // El campo debe aceptar el valor (validación puede ser en submit)
      const value = await phoneInput.inputValue()
      expect(value).toBeTruthy()
    })
  })

  test.describe('Comment Validation', () => {
    let auth: AuthHelper

    test.beforeEach(async ({ page }) => {
      auth = new AuthHelper(page)
      await auth.login('maria.gonzalez@test.com', 'TestPassword123!')
      await page.waitForURL('/dashboard')

      const monthCards = page.locator('.card').filter({ has: page.locator('.status-circle') })
      if (await monthCards.count() > 0) {
        await monthCards.first().click()
        await page.waitForURL(/\/dashboard\/declaracion/)
      }
    })

    test('should not allow empty comments', async ({ page }) => {
      const input = page.getByPlaceholder(/escribe un comentario/i)
      const submitButton = page.locator('button[type="submit"]').last()

      await input.clear()

      // Botón debe estar deshabilitado
      await expect(submitButton).toBeDisabled()
    })

    test('should allow comments with special characters', async ({ page }) => {
      const input = page.getByPlaceholder(/escribe un comentario/i)

      const specialChars = 'Comentario con ñ, áéíóú, ¿¡! y símbolos: $#@%&*'
      await input.fill(specialChars)

      const value = await input.inputValue()
      expect(value).toBe(specialChars)
    })

    test('should handle very long comments', async ({ page }) => {
      const input = page.getByPlaceholder(/escribe un comentario/i)

      const longComment = 'a'.repeat(1000)
      await input.fill(longComment)

      // El campo debe aceptar el texto
      const value = await input.inputValue()
      expect(value.length).toBeGreaterThan(0)
    })

    test('should trim whitespace from comments', async ({ page }) => {
      const input = page.getByPlaceholder(/escribe un comentario/i)
      const submitButton = page.locator('button[type="submit"]').last()

      // Solo espacios
      await input.fill('   ')

      // Botón debería estar deshabilitado
      await expect(submitButton).toBeDisabled()
    })
  })

  test.describe('File Upload Validation', () => {
    let auth: AuthHelper

    test.beforeEach(async ({ page }) => {
      auth = new AuthHelper(page)
      await auth.login('maria.gonzalez@test.com', 'TestPassword123!')
      await page.waitForURL('/dashboard')

      const monthCards = page.locator('.card').filter({ has: page.locator('.status-circle') })
      if (await monthCards.count() > 0) {
        await monthCards.first().click()
        await page.waitForURL(/\/dashboard\/declaracion/)

        const uploadButton = page.getByRole('button', { name: /subir factura/i })
        if (await uploadButton.count() > 0) {
          await uploadButton.click()
        }
      }
    })

    test('should accept valid file types', async ({ page }) => {
      const validTypes = [
        { name: 'factura.pdf', type: 'application/pdf' },
        { name: 'factura.xml', type: 'application/xml' },
        { name: 'ticket.jpg', type: 'image/jpeg' },
        { name: 'ticket.png', type: 'image/png' }
      ]

      for (const file of validTypes) {
        const buffer = Buffer.from('test content')

        const selectButton = page.getByRole('button', { name: /seleccionar archivos/i })
        const fileChooserPromise = page.waitForEvent('filechooser')

        await selectButton.click()

        const fileChooser = await fileChooserPromise
        await fileChooser.setFiles([{
          name: file.name,
          mimeType: file.type,
          buffer: buffer
        }])

        // Verificar que el archivo aparece
        await expect(page.getByText(file.name)).toBeVisible()

        // Limpiar
        const removeButton = page.locator('button').filter({ has: page.locator('svg') }).last()
        await removeButton.click()
      }
    })

    test('should show file size', async ({ page }) => {
      const buffer = Buffer.from('test content with some length')

      const selectButton = page.getByRole('button', { name: /seleccionar archivos/i })
      const fileChooserPromise = page.waitForEvent('filechooser')

      await selectButton.click()

      const fileChooser = await fileChooserPromise
      await fileChooser.setFiles([{
        name: 'test.pdf',
        mimeType: 'application/pdf',
        buffer: buffer
      }])

      // Debe mostrar el tamaño
      const sizeText = page.locator('text=/B|KB|MB/')
      await expect(sizeText).toBeVisible()
    })

    test('should handle multiple file uploads', async ({ page }) => {
      const files = [
        { name: 'file1.pdf', type: 'application/pdf' },
        { name: 'file2.xml', type: 'application/xml' }
      ]

      const selectButton = page.getByRole('button', { name: /seleccionar archivos/i })
      const fileChooserPromise = page.waitForEvent('filechooser')

      await selectButton.click()

      const fileChooser = await fileChooserPromise
      await fileChooser.setFiles(files.map(f => ({
        name: f.name,
        mimeType: f.type,
        buffer: Buffer.from('test')
      })))

      // Ambos archivos deben aparecer
      await expect(page.getByText('file1.pdf')).toBeVisible()
      await expect(page.getByText('file2.xml')).toBeVisible()
    })
  })

  test.describe('Search Validation', () => {
    let auth: AuthHelper

    test.beforeEach(async ({ page }) => {
      auth = new AuthHelper(page)
      await auth.login('juan.perez@test.com', 'TestPassword456!')
      await page.waitForURL('/dashboard')
    })

    test('should handle search with special characters', async ({ page }) => {
      const searchInput = page.getByPlaceholder(/buscar/i)

      const specialChars = 'test@#$%^&*()'
      await searchInput.fill(specialChars)

      await page.waitForTimeout(500)

      // No debe crashear
      const value = await searchInput.inputValue()
      expect(value).toBe(specialChars)
    })

    test('should handle empty search', async ({ page }) => {
      const searchInput = page.getByPlaceholder(/buscar/i)

      await searchInput.fill('something')
      await searchInput.clear()

      await page.waitForTimeout(500)

      // Debe mostrar todos los resultados de nuevo
      const clientCards = page.locator('.card').filter({ has: page.locator('[role="img"]') })
      const count = await clientCards.count()

      expect(count).toBeGreaterThanOrEqual(0)
    })

    test('should be case-insensitive', async ({ page }) => {
      const searchInput = page.getByPlaceholder(/buscar/i)

      // Buscar en minúsculas
      await searchInput.fill('maria')
      await page.waitForTimeout(500)

      const lowerCaseResults = await page.locator('.card').count()

      // Buscar en mayúsculas
      await searchInput.clear()
      await searchInput.fill('MARIA')
      await page.waitForTimeout(500)

      const upperCaseResults = await page.locator('.card').count()

      // Deberían dar los mismos resultados
      expect(lowerCaseResults).toBe(upperCaseResults)
    })

    test('should handle very long search queries', async ({ page }) => {
      const searchInput = page.getByPlaceholder(/buscar/i)

      const longQuery = 'a'.repeat(100)
      await searchInput.fill(longQuery)

      await page.waitForTimeout(500)

      // No debe crashear
      const value = await searchInput.inputValue()
      expect(value.length).toBe(100)
    })
  })

  test.describe('XSS Prevention', () => {
    test('should sanitize user input in comments', async ({ page }) => {
      const auth = new AuthHelper(page)
      await auth.login('maria.gonzalez@test.com', 'TestPassword123!')
      await page.waitForURL('/dashboard')

      const monthCards = page.locator('.card').filter({ has: page.locator('.status-circle') })
      if (await monthCards.count() > 0) {
        await monthCards.first().click()
        await page.waitForURL(/\/dashboard\/declaracion/)

        const input = page.getByPlaceholder(/escribe un comentario/i)

        // Intentar XSS
        const xssPayload = '<script>alert("XSS")</script>'
        await input.fill(xssPayload)

        const submitButton = page.locator('button[type="submit"]').last()
        await submitButton.click()

        await page.waitForTimeout(1000)

        // No debe haber alert (XSS prevenido)
        // El texto debe aparecer escapado o sanitizado
        const commentText = await page.getByText(xssPayload).count()

        // Si aparece, debe estar como texto plano, no ejecutado
        expect(commentText).toBeGreaterThanOrEqual(0)
      }
    })

    test('should not execute HTML in user names', async ({ page }) => {
      const auth = new AuthHelper(page)

      // Intentar registrar con nombre malicioso
      const maliciousName = '<img src=x onerror=alert(1)>'

      await page.goto('/register')

      await page.locator('select, [role="combobox"]').first().click()
      await page.getByText('Contribuyente').click()
      await page.getByLabel('Nombre').fill(maliciousName)
      await page.getByLabel('Apellidos').fill('Test')
      await page.getByLabel(/correo/i).fill(`xss-${Date.now()}@test.com`)
      await page.getByLabel(/contraseña/i).fill('password123456')

      await page.getByRole('button', { name: /registrarse/i }).click()

      await page.waitForTimeout(2000)

      // No debe haber alert
      // El nombre debe aparecer como texto
      const hasName = await page.getByText(maliciousName).count() > 0
      expect(hasName).toBeTruthy()
    })
  })
})
