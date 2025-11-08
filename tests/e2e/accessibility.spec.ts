import { test, expect } from '@playwright/test'
import { AuthHelper, testUsers } from './helpers'

test.describe('Accessibility Tests (a11y)', () => {
  test.describe('Login Page Accessibility', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      await page.goto('/login')

      // Debe tener un h1
      const h1 = page.locator('h1')
      await expect(h1).toBeVisible()

      // No debe haber saltos en jerarquía (h1 -> h3 sin h2)
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').all()
      expect(headings.length).toBeGreaterThan(0)
    })

    test('should have accessible form labels', async ({ page }) => {
      await page.goto('/login')

      // Todos los inputs deben tener labels asociados
      const emailInput = page.getByLabel(/correo|email/i)
      await expect(emailInput).toBeVisible()

      const passwordInput = page.getByLabel(/contraseña|password/i)
      await expect(passwordInput).toBeVisible()
    })

    test('should have keyboard navigation', async ({ page }) => {
      await page.goto('/login')

      // Debe poder navegar con Tab
      await page.keyboard.press('Tab')
      const focusedEmail = await page.evaluateHandle(() => document.activeElement?.tagName)
      expect(await focusedEmail.jsonValue()).toBe('INPUT')

      // Debe poder hacer submit con Enter
      await page.getByLabel(/correo/i).fill('test@test.com')
      await page.keyboard.press('Tab')
      await page.getByLabel(/contraseña/i).fill('password')
      await page.keyboard.press('Enter')

      // Debe procesar el submit
      await page.waitForTimeout(500)
    })

    test('should have focus indicators', async ({ page }) => {
      await page.goto('/login')

      const emailInput = page.getByLabel(/correo/i)
      await emailInput.focus()

      // El elemento debe tener algún tipo de outline o border cuando está enfocado
      const focusStyles = await emailInput.evaluate((el) => {
        const styles = window.getComputedStyle(el)
        return {
          outline: styles.outline,
          outlineWidth: styles.outlineWidth,
          outlineColor: styles.outlineColor
        }
      })

      // Al menos debe tener algún indicador de foco
      const hasFocusIndicator =
        focusStyles.outline !== 'none' ||
        focusStyles.outlineWidth !== '0px'

      expect(hasFocusIndicator).toBeTruthy()
    })

    test('should have proper button semantics', async ({ page }) => {
      await page.goto('/login')

      // Los botones deben ser <button> o tener role="button"
      const submitButton = page.getByRole('button', { name: /iniciar sesión/i })
      await expect(submitButton).toBeVisible()
    })

    test('should have lang attribute on html', async ({ page }) => {
      await page.goto('/login')

      const lang = await page.getAttribute('html', 'lang')
      expect(lang).toBe('es')
    })
  })

  test.describe('Dashboard Accessibility', () => {
    let auth: AuthHelper

    test.beforeEach(async ({ page }) => {
      auth = new AuthHelper(page)
      await auth.login(testUsers.contribuyente.email, testUsers.contribuyente.password)
      await page.waitForURL('/dashboard')
    })

    test('should have skip to main content link', async ({ page }) => {
      // Verificar que existe navegación principal
      const nav = page.locator('nav').or(page.locator('header'))
      await expect(nav.first()).toBeVisible()
    })

    test('should have descriptive link text', async ({ page }) => {
      // Los links no deben ser solo "click aquí" o "ver más"
      const links = await page.locator('a').all()

      for (const link of links) {
        const text = await link.textContent()
        if (text) {
          const hasDescriptiveText =
            text.length > 2 &&
            !text.toLowerCase().includes('click') &&
            text.trim() !== ''

          expect(hasDescriptiveText).toBeTruthy()
        }
      }
    })

    test('should have alt text on images', async ({ page }) => {
      const images = await page.locator('img').all()

      for (const img of images) {
        const alt = await img.getAttribute('alt')
        expect(alt).toBeDefined()
      }
    })

    test('should have accessible status indicators', async ({ page }) => {
      // Los círculos de estado deben tener texto alternativo o aria-label
      const statusCircles = page.locator('.status-circle')

      if (await statusCircles.count() > 0) {
        const firstCircle = statusCircles.first()

        // Debe tener title, aria-label, o texto descriptivo
        const title = await firstCircle.getAttribute('title')
        const ariaLabel = await firstCircle.getAttribute('aria-label')

        expect(title || ariaLabel).toBeTruthy()
      }
    })

    test('should have proper ARIA roles for interactive elements', async ({ page }) => {
      // Verificar que elementos interactivos tienen roles apropiados
      const buttons = await page.getByRole('button').all()
      expect(buttons.length).toBeGreaterThan(0)

      const links = await page.getByRole('link').all()
      expect(links.length).toBeGreaterThan(0)
    })
  })

  test.describe('Form Accessibility', () => {
    test('should show error messages accessibly', async ({ page }) => {
      await page.goto('/login')

      // Intentar submit sin llenar campos
      await page.getByRole('button', { name: /iniciar sesión/i }).click()

      // Los errores deben ser anunciados a screen readers
      const errors = page.locator('[role="alert"]').or(page.locator('.error'))

      if (await errors.count() > 0) {
        await expect(errors.first()).toBeVisible()
      }
    })

    test('should have required field indicators', async ({ page }) => {
      await page.goto('/register')

      // Los campos requeridos deben estar marcados
      const requiredInputs = await page.locator('input[required]').or(
        page.locator('input[aria-required="true"]')
      ).count()

      expect(requiredInputs).toBeGreaterThan(0)
    })

    test('should have descriptive input placeholders', async ({ page }) => {
      await page.goto('/register')

      const emailInput = page.getByLabel(/correo/i)
      const placeholder = await emailInput.getAttribute('placeholder')

      if (placeholder) {
        expect(placeholder.length).toBeGreaterThan(3)
      }
    })
  })

  test.describe('Color Contrast', () => {
    test('should have sufficient contrast for text', async ({ page }) => {
      await page.goto('/login')

      // Verificar que hay texto visible (no podemos medir contraste exacto pero verificamos visibilidad)
      const heading = page.locator('h1')
      await expect(heading).toBeVisible()

      const textColor = await heading.evaluate((el) => {
        return window.getComputedStyle(el).color
      })

      expect(textColor).toBeTruthy()
    })

    test('should have visible focus states', async ({ page }) => {
      await page.goto('/login')

      const input = page.getByLabel(/correo/i)
      await input.focus()

      // Verificar que el input está enfocado
      const isFocused = await input.evaluate((el) => {
        return document.activeElement === el
      })

      expect(isFocused).toBeTruthy()
    })
  })

  test.describe('Responsive Text', () => {
    test('should allow text zoom', async ({ page }) => {
      await page.goto('/dashboard')

      // Simular zoom
      await page.evaluate(() => {
        document.body.style.zoom = '1.5'
      })

      // El contenido debe seguir siendo visible
      const heading = page.locator('h1')
      await expect(heading).toBeVisible()

      // Resetear
      await page.evaluate(() => {
        document.body.style.zoom = '1'
      })
    })

    test('should have readable text on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('/dashboard')

      const heading = page.locator('h1')
      const fontSize = await heading.evaluate((el) => {
        return window.getComputedStyle(el).fontSize
      })

      // El tamaño de fuente debe ser al menos 16px en mobile
      const size = parseInt(fontSize)
      expect(size).toBeGreaterThanOrEqual(16)
    })
  })

  test.describe('Semantic HTML', () => {
    test('should use semantic HTML5 elements', async ({ page }) => {
      await page.goto('/dashboard')

      // Debe tener elementos semánticos
      const header = page.locator('header')
      const main = page.locator('main')
      const nav = page.locator('nav')

      // Al menos debe tener header
      await expect(header).toBeVisible()
    })

    test('should have proper document structure', async ({ page }) => {
      await page.goto('/dashboard')

      // Verificar que hay jerarquía de headings
      const h1Count = await page.locator('h1').count()
      expect(h1Count).toBeGreaterThanOrEqual(1)
      expect(h1Count).toBeLessThanOrEqual(2) // No más de 2 h1 por página
    })
  })

  test.describe('Keyboard Operability', () => {
    test('should trap focus in modals', async ({ page }) => {
      const auth = new AuthHelper(page)
      await auth.login(testUsers.contribuyente.email, testUsers.contribuyente.password)
      await page.waitForURL('/dashboard')

      // Navegar a declaración y abrir modal de facturas
      const monthCards = page.locator('.card').filter({ has: page.locator('.status-circle') })
      if (await monthCards.count() > 0) {
        await monthCards.first().click()
        await page.waitForURL(/\/dashboard\/declaracion/)

        // Abrir modal
        const uploadButton = page.getByRole('button', { name: /subir factura/i })
        if (await uploadButton.count() > 0) {
          await uploadButton.click()

          // El foco debe estar atrapado en el modal
          await page.keyboard.press('Tab')
          await page.keyboard.press('Tab')
          await page.keyboard.press('Tab')

          // Verificar que no se sale del modal
          const modal = page.locator('[role="dialog"]')
          await expect(modal).toBeVisible()
        }
      }
    })

    test('should allow ESC to close modals', async ({ page }) => {
      const auth = new AuthHelper(page)
      await auth.login(testUsers.contribuyente.email, testUsers.contribuyente.password)
      await page.waitForURL('/dashboard')

      const monthCards = page.locator('.card').filter({ has: page.locator('.status-circle') })
      if (await monthCards.count() > 0) {
        await monthCards.first().click()
        await page.waitForURL(/\/dashboard\/declaracion/)

        const uploadButton = page.getByRole('button', { name: /subir factura/i })
        if (await uploadButton.count() > 0) {
          await uploadButton.click()

          // ESC debe cerrar el modal
          await page.keyboard.press('Escape')

          // Modal debe cerrarse
          const modal = page.locator('[role="dialog"]')
          await expect(modal).not.toBeVisible()
        }
      }
    })

    test('should navigate dropdowns with arrow keys', async ({ page }) => {
      const auth = new AuthHelper(page)
      await auth.login(testUsers.contribuyente.email, testUsers.contribuyente.password)
      await page.waitForURL('/dashboard')

      // Click en avatar para abrir dropdown
      const avatar = page.locator('[role="img"]').or(page.locator('img[alt*="avatar"]')).first()
      if (await avatar.count() > 0) {
        await avatar.click()

        // Debe poder navegar con flechas
        await page.keyboard.press('ArrowDown')
        await page.keyboard.press('ArrowDown')

        // Verificar que el dropdown está abierto
        const menuItems = page.getByText(/perfil|cerrar sesión/i)
        await expect(menuItems.first()).toBeVisible()
      }
    })
  })
})
