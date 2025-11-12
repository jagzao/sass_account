import { generateAuthenticationOptionsForUser } from '~/server/utils/webauthn'
import { logAuditEvent } from '~/server/utils/audit'

/**
 * Generate authentication options for 2FA login
 * This endpoint is called AFTER email/password verification
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { userId } = body

  if (!userId) {
    throw createError({
      statusCode: 400,
      message: 'User ID is required',
    })
  }

  try {
    const options = await generateAuthenticationOptionsForUser(userId)

    // Store challenge in session for verification
    // Note: In Cloudflare Workers, we need to store this temporarily
    // We'll use the event context for now, but in production you might want
    // to use a KV store or similar
    event.context.webauthnChallenge = options.challenge

    await logAuditEvent(event, {
      userId,
      action: '2fa.authentication_initiated',
      resource: `user:${userId}`,
      resourceType: 'user',
    })

    return options
  } catch (error: any) {
    await logAuditEvent(event, {
      userId,
      action: '2fa.authentication_initiated',
      resource: `user:${userId}`,
      resourceType: 'user',
      status: 'failure',
      errorMessage: error.message,
    })

    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to generate authentication options',
    })
  }
})
