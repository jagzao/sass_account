import { useDB, schema } from '~/server/db'
import { initializeLucia } from '~/server/utils/auth'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { verifyPassword } from '~/server/utils/password'

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida')
})

export default defineEventHandler(async (event) => {
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
      throw createError({
        statusCode: 401,
        statusMessage: 'Email o contraseña incorrectos'
      })
    }

    // Crear sesión
    const lucia = initializeLucia(event.context.cloudflare.env.DB)
    const session = await lucia.createSession(user.id, {})

    appendResponseHeader(
      event,
      'Set-Cookie',
      lucia.createSessionCookie(session.id).serialize()
    )

    return {
      success: true,
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
