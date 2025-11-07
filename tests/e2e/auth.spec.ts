import { test, expect } from '@playwright/test'
import { AuthHelper, testUsers } from './helpers'

test.describe('Authentication Flow', () => {
  test.describe('Login Page', () => {
    test('should display login form', async ({ page }) => {
      await page.goto('/login')

      await expect(page.locator('h1')).toContainText(/bienvenido/i)
      await expect(page.getByLabel('Correo electrónico')).toBeVisible()
      await expect(page.getByLabel('Contraseña')).toBeVisible()
      await expect(page.getByRole('button', { name: /iniciar sesión/i })).toBeVisible()
    })

    test('should toggle password visibility', async ({ page }) => {
      await page.goto('/login')

      const passwordInput = page.getByLabel('Contraseña')
      await expect(passwordInput).toHaveAttribute('type', 'password')

      // Click en el botón de toggle
      await page.locator('button').filter({ has: page.locator('svg') }).last().click()
      await expect(passwordInput).toHaveAttribute('type', 'text')
    })

    test('should show validation errors for empty fields', async ({ page }) => {
      await page.goto('/login')

      await page.getByRole('button', { name: /iniciar sesión/i }).click()

      // Esperar mensajes de error
      await expect(page.locator('text=/requerido/i')).toBeVisible()
    })

    test('should show error with invalid credentials', async ({ page }) => {
      const auth = new AuthHelper(page)
      await auth.login('invalid@email.com', 'wrongpassword')

      // Esperar mensaje de error
      await expect(page.locator('[role="alert"]')).toBeVisible()
      await expect(page.locator('text=/incorrectos/i')).toBeVisible()
    })

    test('should redirect to dashboard after successful login', async ({ page }) => {
      const auth = new AuthHelper(page)
      await auth.login(testUsers.contribuyente.email, testUsers.contribuyente.password)

      await expect(page).toHaveURL('/dashboard')
    })

    test('should have link to register page', async ({ page }) => {
      await page.goto('/login')

      await page.getByRole('button', { name: /registrarse/i }).click()
      await expect(page).toHaveURL('/register')
    })
  })

  test.describe('Register Page', () => {
    test('should display register form', async ({ page }) => {
      await page.goto('/register')

      await expect(page.locator('h1')).toContainText(/crear cuenta/i)
      await expect(page.getByLabel('Nombre')).toBeVisible()
      await expect(page.getByLabel('Apellidos')).toBeVisible()
      await expect(page.getByLabel('Correo electrónico')).toBeVisible()
      await expect(page.getByLabel('Contraseña')).toBeVisible()
    })

    test('should show conditional fields for contribuyente', async ({ page }) => {
      await page.goto('/register')

      // Seleccionar contribuyente
      await page.locator('select, [role="combobox"]').first().click()
      await page.getByText('Contribuyente').click()

      // Verificar campos específicos
      await expect(page.getByLabel('RFC')).toBeVisible()
      await expect(page.getByLabel('Régimen Fiscal')).toBeVisible()
    })

    test('should show conditional fields for contador', async ({ page }) => {
      await page.goto('/register')

      // Seleccionar contador
      await page.locator('select, [role="combobox"]').first().click()
      await page.getByText('Contador').click()

      // Verificar campo específico
      await expect(page.getByLabel('Despacho')).toBeVisible()
    })

    test('should validate password length', async ({ page }) => {
      await page.goto('/register')

      await page.getByLabel('Nombre').fill('Test')
      await page.getByLabel('Apellidos').fill('User')
      await page.getByLabel('Correo electrónico').fill('test@test.com')
      await page.getByLabel('Contraseña').fill('123')

      await page.getByRole('button', { name: /registrarse/i }).click()

      await expect(page.locator('text=/8 caracteres/i')).toBeVisible()
    })

    test('should register contribuyente successfully', async ({ page }) => {
      const auth = new AuthHelper(page)
      const uniqueEmail = `contribuyente-${Date.now()}@test.com`

      await auth.register({
        ...testUsers.contribuyente,
        email: uniqueEmail
      })

      // Debe redirigir al dashboard
      await expect(page).toHaveURL('/dashboard', { timeout: 10000 })
    })

    test('should register contador successfully', async ({ page }) => {
      const auth = new AuthHelper(page)
      const uniqueEmail = `contador-${Date.now()}@test.com`

      await auth.register({
        ...testUsers.contador,
        email: uniqueEmail
      })

      // Debe redirigir al dashboard
      await expect(page).toHaveURL('/dashboard', { timeout: 10000 })
    })

    test('should have link to login page', async ({ page }) => {
      await page.goto('/register')

      await page.getByRole('button', { name: /iniciar sesión/i }).click()
      await expect(page).toHaveURL('/login')
    })
  })

  test.describe('Logout', () => {
    test('should logout successfully', async ({ page }) => {
      const auth = new AuthHelper(page)

      // Login primero
      await auth.login(testUsers.contribuyente.email, testUsers.contribuyente.password)
      await expect(page).toHaveURL('/dashboard')

      // Logout
      await auth.logout()

      // Debe redirigir a login
      await expect(page).toHaveURL('/login', { timeout: 5000 })
    })
  })

  test.describe('Protected Routes', () => {
    test('should redirect to login when accessing dashboard without auth', async ({ page }) => {
      await page.goto('/dashboard')

      await expect(page).toHaveURL('/login', { timeout: 5000 })
    })

    test('should redirect to dashboard when accessing login while authenticated', async ({ page }) => {
      const auth = new AuthHelper(page)

      // Login
      await auth.login(testUsers.contribuyente.email, testUsers.contribuyente.password)
      await expect(page).toHaveURL('/dashboard')

      // Intentar acceder a login
      await page.goto('/login')

      // Debe redirigir de vuelta al dashboard
      await expect(page).toHaveURL('/dashboard', { timeout: 5000 })
    })
  })
})
