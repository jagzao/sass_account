import { useDB, schema } from '~/server/db'
import { initializeLucia } from '~/server/utils/auth'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { verifyPassword } from '~/server/utils/password'
import { rateLimit } from '~/server/utils/ratelimit'
import { logAuditEvent } from '~/server/utils/audit'
import { userHas2FA } from '~/server/utils/webauthn'

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida')
})

// Rate limit: 5 login attempts per minute per IP
const loginRateLimit = rateLimit({
  maxRequests: 5,
  windowMs: 60 * 1000, // 1 minute
  skipSuccessfulRequests: true
})

export default defineEventHandler(async (event) => {
  // Apply rate limiting
  await loginRateLimit(event)
  try {
    const body = await readBody(event)
    const { email, password } = loginSchema.parse(body)

    const db = useDB()

    // Buscar usuario
    const user = await db
      .select()
      .from(schema.usuarios)
      .where(eq(schema.usuarios.email, email))
      .get()

    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Email o contraseña incorrectos'
      })
    }

    if (!user.activo) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Usuario inactivo'
      })
    }

    // Verificar contraseña
    const validPassword = await verifyPassword(password, user.hashedPassword)

    if (!validPassword) {
      // Log failed login attempt
      await logAuditEvent(event, {
        userId: user.id,
        action: 'user.login_failed',
        resource: `user:${user.id}`,
        resourceType: 'user',
        status: 'failure',
        errorMessage: 'Invalid password',
        metadata: { email },
      })

      throw createError({
        statusCode: 401,
        statusMessage: 'Email o contraseña incorrectos'
      })
    }

    // Check if user has 2FA enabled
    const has2FA = await userHas2FA(user.id)

    if (has2FA) {
      // Don't create session yet - user needs to complete 2FA
      return {
        success: true,
        requires2FA: true,
        userId: user.id,
        message: 'Please complete 2FA authentication'
      }
    }

    // No 2FA - create session directly
    const lucia = initializeLucia(event.context.cloudflare.env.DB)
    const session = await lucia.createSession(user.id, {})

    appendResponseHeader(
      event,
      'Set-Cookie',
      lucia.createSessionCookie(session.id).serialize()
    )

    // Log successful login
    await logAuditEvent(event, {
      userId: user.id,
      action: 'user.login_success',
      resource: `user:${user.id}`,
      resourceType: 'user',
      metadata: {
        email: user.email,
        rol: user.rol,
      },
    })

    return {
      success: true,
      requires2FA: false,
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        apellidos: user.apellidos,
        rol: user.rol,
        rfc: user.rfc,
        telefono: user.telefono,
        avatarUrl: user.avatarUrl,
        despacho: user.despacho,
        regimenFiscal: user.regimenFiscal
      }
    }
  } catch (error: any) {
    if (error.issues) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Datos inválidos',
        data: error.issues
      })
    }
    throw error
  }
})
