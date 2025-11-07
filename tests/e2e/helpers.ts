import { Page } from '@playwright/test'

export interface TestUser {
  email: string
  password: string
  nombre: string
  apellidos: string
  rol: 'contribuyente' | 'contador'
  rfc?: string
  despacho?: string
  regimenFiscal?: string
}

export const testUsers = {
  contribuyente: {
    email: 'maria.gonzalez@test.com',
    password: 'TestPassword123!',
    nombre: 'María',
    apellidos: 'González López',
    rol: 'contribuyente' as const,
    rfc: 'GOLM850123ABC',
    regimenFiscal: 'Persona Física con Actividad Empresarial'
  },
  contador: {
    email: 'juan.perez@test.com',
    password: 'TestPassword456!',
    nombre: 'Juan',
    apellidos: 'Pérez Contador',
    rol: 'contador' as const,
    despacho: 'Despacho Fiscal Pérez'
  }
}

export class AuthHelper {
  constructor(private page: Page) {}

  async register(user: TestUser) {
    await this.page.goto('/register')

    // Seleccionar rol
    await this.page.locator('select, [role="combobox"]').first().click()
    await this.page.getByText(user.rol === 'contribuyente' ? 'Contribuyente' : 'Contador').click()

    // Llenar formulario básico
    await this.page.getByLabel('Nombre').fill(user.nombre)
    await this.page.getByLabel('Apellidos').fill(user.apellidos)
    await this.page.getByLabel('Correo electrónico').fill(user.email)
    await this.page.getByLabel('Contraseña').fill(user.password)

    // Campos condicionales
    if (user.rol === 'contribuyente' && user.rfc) {
      await this.page.getByLabel('RFC').fill(user.rfc)
      if (user.regimenFiscal) {
        await this.page.getByLabel('Régimen Fiscal').fill(user.regimenFiscal)
      }
    }

    if (user.rol === 'contador' && user.despacho) {
      await this.page.getByLabel('Despacho').fill(user.despacho)
    }

    // Submit
    await this.page.getByRole('button', { name: /registrarse/i }).click()
  }

  async login(email: string, password: string) {
    await this.page.goto('/login')
    await this.page.getByLabel('Correo electrónico').fill(email)
    await this.page.getByLabel('Contraseña').fill(password)
    await this.page.getByRole('button', { name: /iniciar sesión/i }).click()
  }

  async logout() {
    // Click en el avatar
    await this.page.locator('[role="button"]').filter({ has: this.page.locator('img[alt*="avatar"]') }).click()
    // Click en cerrar sesión
    await this.page.getByText(/cerrar sesión/i).click()
  }

  async isLoggedIn(): Promise<boolean> {
    try {
      await this.page.waitForURL('/dashboard', { timeout: 5000 })
      return true
    } catch {
      return false
    }
  }
}

export class DashboardHelper {
  constructor(private page: Page) {}

  async waitForDashboard() {
    await this.page.waitForURL('/dashboard')
    await this.page.waitForLoadState('networkidle')
  }

  async getMonthCards() {
    return this.page.locator('.card').filter({ has: this.page.locator('.status-circle') })
  }

  async clickMonth(mes: string) {
    await this.page.getByText(mes).first().click()
  }

  async searchClientes(query: string) {
    await this.page.getByPlaceholder(/buscar/i).fill(query)
  }

  async getClienteCards() {
    return this.page.locator('.card').filter({ has: this.page.locator('[role="img"]') })
  }
}

export class DeclaracionHelper {
  constructor(private page: Page) {}

  async waitForDeclaracion() {
    await this.page.waitForURL(/\/dashboard\/declaracion\/\w+/)
    await this.page.waitForLoadState('networkidle')
  }

  async toggleChecklistItem(texto: string) {
    const item = this.page.locator('label').filter({ hasText: texto })
    await item.locator('input[type="checkbox"]').click()
  }

  async isChecklistItemCompleted(texto: string): Promise<boolean> {
    const checkbox = this.page.locator('label').filter({ hasText: texto }).locator('input[type="checkbox"]')
    return await checkbox.isChecked()
  }

  async sendComment(mensaje: string) {
    await this.page.getByPlaceholder(/escribe un comentario/i).fill(mensaje)
    await this.page.locator('button[type="submit"]').last().click()
  }

  async getComments() {
    return this.page.locator('.chat-message')
  }

  async uploadFactura() {
    await this.page.getByRole('button', { name: /subir factura/i }).click()
  }

  async getFacturas() {
    return this.page.locator('[class*="factura"]').or(this.page.locator('.border').filter({ has: this.page.locator('svg') }))
  }
}

export async function setupTestData(page: Page) {
  // En un entorno real, aquí se crearían datos de prueba en la BD
  // Por ahora, asumimos que los datos mock están disponibles
  return {
    declaracionId: 'test-declaracion-1',
    facturaId: 'test-factura-1'
  }
}

export async function cleanupTestData(page: Page) {
  // Limpiar datos de prueba después de los tests
  // Por ahora, solo hacemos logout
  const auth = new AuthHelper(page)
  try {
    await auth.logout()
  } catch {
    // Ignore si no está logueado
  }
}
