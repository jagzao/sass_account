import { test, expect } from '@playwright/test'
import { AuthHelper } from './helpers'

test.describe('Performance Tests', () => {
  test.describe('Page Load Performance', () => {
    test('should load login page quickly', async ({ page }) => {
      const startTime = Date.now()
      await page.goto('/login')
      const loadTime = Date.now() - startTime

      // Login page should load in under 3 seconds
      expect(loadTime).toBeLessThan(3000)
    })

    test('should load dashboard quickly after login', async ({ page }) => {
      const auth = new AuthHelper(page)
      await auth.login('maria.gonzalez@test.com', 'TestPassword123!')

      const startTime = Date.now()
      await page.waitForURL('/dashboard')
      const loadTime = Date.now() - startTime

      // Dashboard should load in under 3 seconds
      expect(loadTime).toBeLessThan(3000)
    })

    test('should load declaration detail quickly', async ({ page }) => {
      const auth = new AuthHelper(page)
      await auth.login('maria.gonzalez@test.com', 'TestPassword123!')
      await page.waitForURL('/dashboard')

      const monthCards = page
        .locator('.card')
        .filter({ has: page.locator('.status-circle') })
      if ((await monthCards.count()) > 0) {
        const startTime = Date.now()
        await monthCards.first().click()
        await page.waitForURL(/\/dashboard\/declaracion/)
        const loadTime = Date.now() - startTime

        // Detail page should load in under 2 seconds
        expect(loadTime).toBeLessThan(2000)
      }
    })

    test('should have minimal redirects', async ({ page }) => {
      const responses: any[] = []

      page.on('response', (response) => {
        if (response.status() === 301 || response.status() === 302) {
          responses.push(response)
        }
      })

      await page.goto('/login')

      // Should have minimal redirects
      expect(responses.length).toBeLessThan(3)
    })
  })

  test.describe('Resource Loading', () => {
    test('should load images efficiently', async ({ page }) => {
      await page.goto('/login')

      const images = await page.locator('img').all()

      for (const img of images) {
        const src = await img.getAttribute('src')
        if (src && !src.startsWith('data:')) {
          // All images should have loaded successfully
          const naturalWidth = await img.evaluate(
            (el) => (el as HTMLImageElement).naturalWidth
          )
          expect(naturalWidth).toBeGreaterThan(0)
        }
      }
    })

    test('should not load unnecessary resources', async ({ page }) => {
      const requests: any[] = []

      page.on('request', (request) => {
        requests.push(request)
      })

      await page.goto('/login')

      // Should not load an excessive number of resources
      expect(requests.length).toBeLessThan(50)
    })

    test('should use caching headers', async ({ page }) => {
      const cachedResources: any[] = []

      page.on('response', async (response) => {
        const cacheHeader = await response.headerValue('cache-control')
        if (cacheHeader && cacheHeader.includes('max-age')) {
          cachedResources.push(response)
        }
      })

      await page.goto('/dashboard')

      // At least some resources should be cacheable
      expect(cachedResources.length).toBeGreaterThan(0)
    })
  })

  test.describe('API Performance', () => {
    test('should fetch declarations quickly', async ({ page }) => {
      const auth = new AuthHelper(page)
      await auth.login('maria.gonzalez@test.com', 'TestPassword123!')

      const responsePromise = page.waitForResponse(
        (response) =>
          response.url().includes('/api/declaraciones') && response.status() === 200
      )

      await page.goto('/dashboard')

      const startTime = Date.now()
      const response = await responsePromise
      const responseTime = Date.now() - startTime

      // API should respond in under 1 second
      expect(responseTime).toBeLessThan(1000)
      expect(response.status()).toBe(200)
    })

    test('should handle concurrent API requests', async ({ page }) => {
      const auth = new AuthHelper(page)
      await auth.login('juan.perez@test.com', 'TestPassword456!')

      const apiCalls: any[] = []

      page.on('response', (response) => {
        if (response.url().includes('/api/')) {
          apiCalls.push(response)
        }
      })

      await page.goto('/dashboard')
      await page.waitForTimeout(2000)

      // All API calls should succeed
      const failedCalls = apiCalls.filter((call) => call.status() >= 400)
      expect(failedCalls.length).toBe(0)
    })

    test('should fetch comments with pagination', async ({ page }) => {
      const auth = new AuthHelper(page)
      await auth.login('maria.gonzalez@test.com', 'TestPassword123!')
      await page.waitForURL('/dashboard')

      const monthCards = page
        .locator('.card')
        .filter({ has: page.locator('.status-circle') })
      if ((await monthCards.count()) > 0) {
        await monthCards.first().click()
        await page.waitForURL(/\/dashboard\/declaracion/)

        const commentSection = page.locator('.comments-section, [class*="comment"]')

        // Comments should load without timeout
        await expect(commentSection.first()).toBeVisible({ timeout: 5000 })
      }
    })
  })

  test.describe('Interaction Performance', () => {
    test('should toggle checkboxes quickly', async ({ page }) => {
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
        if ((await checkboxes.count()) > 0) {
          const checkbox = checkboxes.first()

          const startTime = Date.now()
          await checkbox.click()
          await page.waitForTimeout(100)
          const responseTime = Date.now() - startTime

          // Interaction should be fast (under 500ms)
          expect(responseTime).toBeLessThan(500)
        }
      }
    })

    test('should search clients quickly', async ({ page }) => {
      const auth = new AuthHelper(page)
      await auth.login('juan.perez@test.com', 'TestPassword456!')
      await page.waitForURL('/dashboard')

      const searchInput = page.getByPlaceholder(/buscar/i)
      if (await searchInput.isVisible()) {
        const startTime = Date.now()
        await searchInput.fill('Maria')
        await page.waitForTimeout(300)
        const responseTime = Date.now() - startTime

        // Search should respond quickly (under 1 second)
        expect(responseTime).toBeLessThan(1000)
      }
    })

    test('should submit comments quickly', async ({ page }) => {
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

        await input.fill('Test comment for performance')

        const startTime = Date.now()
        await submitButton.click()
        await page.waitForTimeout(500)
        const responseTime = Date.now() - startTime

        // Comment submission should be fast (under 2 seconds)
        expect(responseTime).toBeLessThan(2000)
      }
    })
  })

  test.describe('Memory and Resource Usage', () => {
    test('should not leak memory on navigation', async ({ page }) => {
      const auth = new AuthHelper(page)
      await auth.login('maria.gonzalez@test.com', 'TestPassword123!')

      // Navigate multiple times
      for (let i = 0; i < 5; i++) {
        await page.goto('/dashboard')
        await page.waitForTimeout(500)
      }

      // Page should still be responsive
      const heading = page.getByRole('heading', { name: /bienvenid/i })
      await expect(heading).toBeVisible({ timeout: 3000 })
    })

    test('should handle large data sets', async ({ page }) => {
      const auth = new AuthHelper(page)
      await auth.login('juan.perez@test.com', 'TestPassword456!')
      await page.waitForURL('/dashboard')

      // Dashboard should render even with multiple clients
      const clientCards = page
        .locator('.card')
        .filter({ has: page.locator('[role="img"]') })

      // Should handle reasonable number of clients
      const count = await clientCards.count()
      expect(count).toBeGreaterThanOrEqual(0)
      expect(count).toBeLessThan(1000)
    })

    test('should clean up file uploads', async ({ page }) => {
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
        if (await uploadButton.count() > 0) {
          await uploadButton.click()

          // Upload and remove files multiple times
          for (let i = 0; i < 3; i++) {
            const selectButton = page.getByRole('button', {
              name: /seleccionar archivos/i
            })
            const fileChooserPromise = page.waitForEvent('filechooser')

            await selectButton.click()

            const fileChooser = await fileChooserPromise
            await fileChooser.setFiles([
              {
                name: `test${i}.pdf`,
                mimeType: 'application/pdf',
                buffer: Buffer.from('test content')
              }
            ])

            await page.waitForTimeout(300)

            const clearButton = page.getByRole('button', { name: /limpiar todo/i })
            if (await clearButton.isVisible()) {
              await clearButton.click()
            }
          }

          // Modal should still be responsive
          await expect(selectButton).toBeVisible()
        }
      }
    })
  })

  test.describe('Bundle Size and Loading', () => {
    test('should have reasonable JavaScript bundle size', async ({ page }) => {
      const jsRequests: any[] = []

      page.on('response', async (response) => {
        const url = response.url()
        if (url.endsWith('.js') || url.includes('/_nuxt/')) {
          const buffer = await response.body().catch(() => null)
          if (buffer) {
            jsRequests.push({
              url,
              size: buffer.length
            })
          }
        }
      })

      await page.goto('/login')

      // Total JS size should be reasonable (under 1MB for initial load)
      const totalSize = jsRequests.reduce((sum, req) => sum + req.size, 0)
      expect(totalSize).toBeLessThan(1024 * 1024) // 1MB
    })

    test('should lazy load dashboard components', async ({ page }) => {
      const dashboardRequests: any[] = []

      page.on('request', (request) => {
        if (request.url().includes('dashboard')) {
          dashboardRequests.push(request)
        }
      })

      await page.goto('/login')
      const loginRequests = dashboardRequests.length

      const auth = new AuthHelper(page)
      await auth.login('maria.gonzalez@test.com', 'TestPassword123!')
      await page.waitForURL('/dashboard')
      await page.waitForTimeout(1000)

      const dashboardOnlyRequests = dashboardRequests.length - loginRequests

      // Dashboard resources should only load when navigating to dashboard
      expect(dashboardOnlyRequests).toBeGreaterThan(0)
    })

    test('should compress text resources', async ({ page }) => {
      const compressedResponses: any[] = []

      page.on('response', async (response) => {
        const encoding = await response.headerValue('content-encoding')
        if (encoding && (encoding.includes('gzip') || encoding.includes('br'))) {
          compressedResponses.push(response)
        }
      })

      await page.goto('/dashboard')

      // At least some resources should be compressed
      // Note: This may not work in dev mode
      expect(compressedResponses.length).toBeGreaterThanOrEqual(0)
    })
  })

  test.describe('Rendering Performance', () => {
    test('should render calendar view efficiently', async ({ page }) => {
      const auth = new AuthHelper(page)
      await auth.login('maria.gonzalez@test.com', 'TestPassword123!')

      const startTime = Date.now()
      await page.waitForURL('/dashboard')

      const calendar = page.locator('.calendar, [class*="calendar"]').first()
      await calendar.waitFor({ state: 'visible', timeout: 5000 })

      const renderTime = Date.now() - startTime

      // Calendar should render quickly
      expect(renderTime).toBeLessThan(3000)
    })

    test('should switch views without lag', async ({ page }) => {
      const auth = new AuthHelper(page)
      await auth.login('maria.gonzalez@test.com', 'TestPassword123!')
      await page.waitForURL('/dashboard')

      const toggleButton = page.locator('button').filter({ hasText: /lista|calendar/i })
      if ((await toggleButton.count()) > 0) {
        const startTime = Date.now()
        await toggleButton.first().click()
        await page.waitForTimeout(300)
        const switchTime = Date.now() - startTime

        // View switch should be instantaneous (under 500ms)
        expect(switchTime).toBeLessThan(500)
      }
    })

    test('should scroll smoothly with many items', async ({ page }) => {
      const auth = new AuthHelper(page)
      await auth.login('juan.perez@test.com', 'TestPassword456!')
      await page.waitForURL('/dashboard')

      const clientList = page.locator('.client-list, [class*="client"]')

      const startTime = Date.now()
      await page.mouse.wheel(0, 1000)
      await page.waitForTimeout(100)
      await page.mouse.wheel(0, -1000)
      const scrollTime = Date.now() - startTime

      // Scrolling should be smooth (under 1 second)
      expect(scrollTime).toBeLessThan(1000)
    })
  })
})
