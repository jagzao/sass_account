import { hash } from '@node-rs/argon2'
import { generateIdFromEntropySize } from 'lucia'
import { useDB, schema } from '~/server/db'
import { z } from 'zod'

const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  nombre: z.string().min(2, 'El nombre es requerido'),
  apellidos: z.string().min(2, 'Los apellidos son requeridos'),
  rol: z.enum(['contribuyente', 'contador']),
  telefono: z.string().optional(),
  rfc: z.string().optional(),
  despacho: z.string().optional(),
  regimenFiscal: z.string().optional()
})

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const validatedData = registerSchema.parse(body)

    const db = useDB()

    // Verificar si el usuario ya existe
    const existingUser = await db
      .select()
      .from(schema.usuarios)
      .where(eq(schema.usuarios.email, validatedData.email))
      .get()

    if (existingUser) {
      throw createError({
        statusCode: 400,
        statusMessage: 'El email ya está registrado'
      })
    }

    // Hash de la contraseña
    const hashedPassword = await hash(validatedData.password, {
      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 1
    })

    const userId = generateIdFromEntropySize(10)

    // Crear usuario
    await db.insert(schema.usuarios).values({
      id: userId,
      email: validatedData.email,
      hashedPassword,
      nombre: validatedData.nombre,
      apellidos: validatedData.apellidos,
      rol: validatedData.rol,
      telefono: validatedData.telefono,
      rfc: validatedData.rfc,
      despacho: validatedData.despacho,
      regimenFiscal: validatedData.regimenFiscal,
      activo: true
    })

    // Crear sesión
    const lucia = initializeLucia(event.context.cloudflare.env.DB)
    const session = await lucia.createSession(userId, {})

    appendResponseHeader(
      event,
      'Set-Cookie',
      lucia.createSessionCookie(session.id).serialize()
    )

    return {
      success: true,
      user: {
        id: userId,
        email: validatedData.email,
        nombre: validatedData.nombre,
        apellidos: validatedData.apellidos,
        rol: validatedData.rol
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
