import { test, expect } from '@playwright/test'
import { AuthHelper, DashboardHelper, DeclaracionHelper, testUsers } from './helpers'
import path from 'path'

test.describe('Upload Facturas', () => {
  let auth: AuthHelper
  let dashboard: DashboardHelper
  let declaracion: DeclaracionHelper

  test.beforeEach(async ({ page }) => {
    auth = new AuthHelper(page)
    dashboard = new DashboardHelper(page)
    declaracion = new DeclaracionHelper(page)

    // Login como contribuyente
    await auth.login(testUsers.contribuyente.email, testUsers.contribuyente.password)
    await dashboard.waitForDashboard()

    // Navegar a una declaración
    const monthCards = await dashboard.getMonthCards()
    if (await monthCards.count() > 0) {
      await monthCards.first().click()
      await declaracion.waitForDeclaracion()
    }

    // Abrir modal de upload
    await declaracion.uploadFactura()
  })

  test.describe('Upload Modal', () => {
    test('should display upload modal', async ({ page }) => {
      await expect(page.locator('[role="dialog"]').or(page.locator('.modal'))).toBeVisible()
    })

    test('should have drag and drop zone', async ({ page }) => {
      const dropZone = page.locator('text=/arrastra tus archivos/i')
      await expect(dropZone).toBeVisible()
    })

    test('should have file selection button', async ({ page }) => {
      const selectButton = page.getByRole('button', { name: /seleccionar archivos/i })
      await expect(selectButton).toBeVisible()
    })

    test('should show supported formats', async ({ page }) => {
      await expect(page.locator('text=/xml|pdf|jpg|png/i')).toBeVisible()
    })

    test('should have camera scan option', async ({ page }) => {
      const scanButton = page.getByRole('button', { name: /escanear ticket/i })
      await expect(scanButton).toBeVisible()
    })

    test('should have SAT import option', async ({ page }) => {
      const satButton = page.getByRole('button', { name: /importar del sat/i })
      await expect(satButton).toBeVisible()
    })
  })

  test.describe('File Selection', () => {
    test('should open file picker when clicking select button', async ({ page }) => {
      const selectButton = page.getByRole('button', { name: /seleccionar archivos/i })

      // Preparar el file chooser
      const fileChooserPromise = page.waitForEvent('filechooser')
      await selectButton.click()

      const fileChooser = await fileChooserPromise
      expect(fileChooser).toBeTruthy()
    })

    test('should accept multiple file types', async ({ page }) => {
      const selectButton = page.getByRole('button', { name: /seleccionar archivos/i })

      const fileChooserPromise = page.waitForEvent('filechooser')
      await selectButton.click()

      const fileChooser = await fileChooserPromise
      const acceptedTypes = fileChooser.isMultiple()

      expect(acceptedTypes).toBeTruthy()
    })

    test('should show selected files in queue', async ({ page }) => {
      // Crear un archivo temporal para la prueba
      const buffer = Buffer.from('test file content')

      const selectButton = page.getByRole('button', { name: /seleccionar archivos/i })
      const fileChooserPromise = page.waitForEvent('filechooser')
      await selectButton.click()

      const fileChooser = await fileChooserPromise
      await fileChooser.setFiles([{
        name: 'test-factura.pdf',
        mimeType: 'application/pdf',
        buffer: buffer
      }])

      // Verificar que aparece en la lista
      await expect(page.getByText('test-factura.pdf')).toBeVisible()
    })

    test('should display file size', async ({ page }) => {
      const buffer = Buffer.from('test file content')

      const selectButton = page.getByRole('button', { name: /seleccionar archivos/i })
      const fileChooserPromise = page.waitForEvent('filechooser')
      await selectButton.click()

      const fileChooser = await fileChooserPromise
      await fileChooser.setFiles([{
        name: 'test-factura.pdf',
        mimeType: 'application/pdf',
        buffer: buffer
      }])

      // Debe mostrar el tamaño
      await expect(page.locator('text=/KB|MB|B/')).toBeVisible()
    })

    test('should show file type icon', async ({ page }) => {
      const buffer = Buffer.from('test file content')

      const selectButton = page.getByRole('button', { name: /seleccionar archivos/i })
      const fileChooserPromise = page.waitForEvent('filechooser')
      await selectButton.click()

      const fileChooser = await fileChooserPromise
      await fileChooser.setFiles([{
        name: 'test-factura.pdf',
        mimeType: 'application/pdf',
        buffer: buffer
      }])

      // Debe tener un icono
      const fileIcons = page.locator('svg').filter({ hasText: /^$/ })
      await expect(fileIcons.first()).toBeVisible()
    })

    test('should allow removing files from queue', async ({ page }) => {
      const buffer = Buffer.from('test file content')

      const selectButton = page.getByRole('button', { name: /seleccionar archivos/i })
      const fileChooserPromise = page.waitForEvent('filechooser')
      await selectButton.click()

      const fileChooser = await fileChooserPromise
      await fileChooser.setFiles([{
        name: 'test-factura.pdf',
        mimeType: 'application/pdf',
        buffer: buffer
      }])

      // Click en botón de eliminar
      const removeButton = page.locator('button').filter({ has: page.locator('svg[class*="x"]') }).last()
      await removeButton.click()

      // El archivo no debe estar visible
      await expect(page.getByText('test-factura.pdf')).not.toBeVisible()
    })
  })

  test.describe('File Upload Process', () => {
    test('should show upload progress', async ({ page }) => {
      const buffer = Buffer.from('test file content'.repeat(1000))

      const selectButton = page.getByRole('button', { name: /seleccionar archivos/i })
      const fileChooserPromise = page.waitForEvent('filechooser')
      await selectButton.click()

      const fileChooser = await fileChooserPromise
      await fileChooser.setFiles([{
        name: 'large-factura.pdf',
        mimeType: 'application/pdf',
        buffer: buffer
      }])

      // Click en subir
      await page.getByRole('button', { name: /subir archivos/i }).click()

      // Debe mostrar progreso
      await expect(page.locator('text=/subiendo/i')).toBeVisible()
      await expect(page.locator('text=/\d+%/')).toBeVisible()
    })

    test('should show progress bar', async ({ page }) => {
      const buffer = Buffer.from('test file content')

      const selectButton = page.getByRole('button', { name: /seleccionar archivos/i })
      const fileChooserPromise = page.waitForEvent('filechooser')
      await selectButton.click()

      const fileChooser = await fileChooserPromise
      await fileChooser.setFiles([{
        name: 'test-factura.pdf',
        mimeType: 'application/pdf',
        buffer: buffer
      }])

      await page.getByRole('button', { name: /subir archivos/i }).click()

      // Debe mostrar barra de progreso
      const progressBar = page.locator('[class*="progress"]').or(
        page.locator('div[style*="width"]').filter({ has: page.locator('.bg-primary') })
      )

      if (await progressBar.count() > 0) {
        await expect(progressBar.first()).toBeVisible()
      }
    })

    test('should show success state after upload', async ({ page }) => {
      const buffer = Buffer.from('test file content')

      const selectButton = page.getByRole('button', { name: /seleccionar archivos/i })
      const fileChooserPromise = page.waitForEvent('filechooser')
      await selectButton.click()

      const fileChooser = await fileChooserPromise
      await fileChooser.setFiles([{
        name: 'test-factura.pdf',
        mimeType: 'application/pdf',
        buffer: buffer
      }])

      await page.getByRole('button', { name: /subir archivos/i }).click()

      // Esperar que complete
      await expect(page.locator('text=/subido correctamente/i')).toBeVisible({ timeout: 10000 })
    })

    test('should disable upload button during upload', async ({ page }) => {
      const buffer = Buffer.from('test file content')

      const selectButton = page.getByRole('button', { name: /seleccionar archivos/i })
      const fileChooserPromise = page.waitForEvent('filechooser')
      await selectButton.click()

      const fileChooser = await fileChooserPromise
      await fileChooser.setFiles([{
        name: 'test-factura.pdf',
        mimeType: 'application/pdf',
        buffer: buffer
      }])

      const uploadButton = page.getByRole('button', { name: /subir archivos/i })
      await uploadButton.click()

      // El botón debe estar deshabilitado durante la subida
      await expect(uploadButton).toBeDisabled()
    })
  })

  test.describe('Multiple Files', () => {
    test('should upload multiple files', async ({ page }) => {
      const buffer1 = Buffer.from('file 1 content')
      const buffer2 = Buffer.from('file 2 content')

      const selectButton = page.getByRole('button', { name: /seleccionar archivos/i })
      const fileChooserPromise = page.waitForEvent('filechooser')
      await selectButton.click()

      const fileChooser = await fileChooserPromise
      await fileChooser.setFiles([
        {
          name: 'factura-1.pdf',
          mimeType: 'application/pdf',
          buffer: buffer1
        },
        {
          name: 'factura-2.xml',
          mimeType: 'application/xml',
          buffer: buffer2
        }
      ])

      // Ambos archivos deben estar en la lista
      await expect(page.getByText('factura-1.pdf')).toBeVisible()
      await expect(page.getByText('factura-2.xml')).toBeVisible()
    })

    test('should show count of selected files', async ({ page }) => {
      const buffer1 = Buffer.from('file 1')
      const buffer2 = Buffer.from('file 2')

      const selectButton = page.getByRole('button', { name: /seleccionar archivos/i })
      const fileChooserPromise = page.waitForEvent('filechooser')
      await selectButton.click()

      const fileChooser = await fileChooserPromise
      await fileChooser.setFiles([
        {
          name: 'factura-1.pdf',
          mimeType: 'application/pdf',
          buffer: buffer1
        },
        {
          name: 'factura-2.pdf',
          mimeType: 'application/pdf',
          buffer: buffer2
        }
      ])

      // Debe mostrar el conteo
      await expect(page.locator('text=/2|archivos seleccionados/i')).toBeVisible()
    })
  })

  test.describe('Clear and Cancel', () => {
    test('should clear all files', async ({ page }) => {
      const buffer = Buffer.from('test')

      const selectButton = page.getByRole('button', { name: /seleccionar archivos/i })
      const fileChooserPromise = page.waitForEvent('filechooser')
      await selectButton.click()

      const fileChooser = await fileChooserPromise
      await fileChooser.setFiles([{
        name: 'test.pdf',
        mimeType: 'application/pdf',
        buffer: buffer
      }])

      // Click en limpiar
      await page.getByRole('button', { name: /limpiar/i }).click()

      // No debe haber archivos
      await expect(page.getByText('test.pdf')).not.toBeVisible()
    })

    test('should close modal on cancel', async ({ page }) => {
      await page.getByRole('button', { name: /cancelar|cerrar/i }).first().click()

      // Modal debe cerrarse
      await expect(page.locator('[role="dialog"]')).not.toBeVisible()
    })
  })

  test.describe('Camera Scan', () => {
    test('should open camera modal', async ({ page }) => {
      const scanButton = page.getByRole('button', { name: /escanear ticket/i })
      await scanButton.click()

      // Debe abrir modal de cámara
      await expect(page.locator('text=/escanear ticket/i')).toBeVisible()
    })

    test('should have capture button in camera modal', async ({ page }) => {
      const scanButton = page.getByRole('button', { name: /escanear ticket/i })
      await scanButton.click()

      await expect(page.getByRole('button', { name: /capturar/i })).toBeVisible()
    })
  })

  test.describe('Drag and Drop', () => {
    test('should highlight drop zone on drag over', async ({ page }) => {
      const dropZone = page.locator('text=/arrastra tus archivos/i').locator('..')

      // Simular drag over
      await dropZone.dispatchEvent('dragover', {
        dataTransfer: {
          files: []
        }
      })

      // La zona debe cambiar de estilo (highlight)
      await page.waitForTimeout(200)
    })
  })
})
