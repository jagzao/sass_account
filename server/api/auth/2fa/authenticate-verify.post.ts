import { verifyAuthenticationForUser } from '~/server/utils/webauthn'
import { initializeLucia } from '~/server/utils/auth'
import { useDB, schema } from '~/server/db'
import { eq } from 'drizzle-orm'
import { logAuditEvent } from '~/server/utils/audit'

/**
 * Verify 2FA authentication and create session
 * This endpoint is called AFTER successful WebAuthn authentication
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { userId, response, expectedChallenge } = body

  if (!userId || !response || !expectedChallenge) {
    throw createError({
      statusCode: 400,
      message: 'Missing required fields',
    })
  }

  try {
    // Verify the WebAuthn response
    const verification = await verifyAuthenticationForUser(
      userId,
      response,
      expectedChallenge
    )

    if (!verification.verified) {
      await logAuditEvent(event, {
        userId,
        action: '2fa.authentication_failed',
        resource: `user:${userId}`,
        resourceType: 'user',
        status: 'failure',
        errorMessage: 'Authentication verification failed',
      })

      throw createError({
        statusCode: 401,
        message: 'Authentication failed',
      })
    }

    // Get user data
    const db = useDB()
    const user = await db
      .select()
      .from(schema.usuarios)
      .where(eq(schema.usuarios.id, userId))
      .get()

    if (!user) {
      throw createError({
        statusCode: 404,
        message: 'User not found',
      })
    }

    // Create session
    const lucia = initializeLucia(event.context.cloudflare.env.DB)
    const session = await lucia.createSession(user.id, {})

    appendResponseHeader(
      event,
      'Set-Cookie',
      lucia.createSessionCookie(session.id).serialize()
    )

    // Log successful 2FA authentication
    await logAuditEvent(event, {
      userId: user.id,
      action: '2fa.authentication_success',
      resource: `user:${user.id}`,
      resourceType: 'user',
      metadata: {
        email: user.email,
        rol: user.rol,
      },
    })

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
    if (!error.statusCode) {
      await logAuditEvent(event, {
        userId,
        action: '2fa.authentication_failed',
        resource: `user:${userId}`,
        resourceType: 'user',
        status: 'failure',
        errorMessage: error.message,
      })
    }

    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Authentication failed',
    })
  }
})
