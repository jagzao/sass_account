import { generateRegistrationOptionsForUser } from '~/server/utils/webauthn'
import { logAuditEvent } from '~/server/utils/audit'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  try {
    const options = await generateRegistrationOptionsForUser(
      user.id,
      user.email
    )

    // Store challenge in session (for verification later)
    // In production, you might want to store this in Redis or similar
    event.context.webauthnChallenge = options.challenge

    await logAuditEvent(event, {
      userId: user.id,
      action: '2fa.registration_initiated',
      resource: `user:${user.id}`,
      resourceType: 'user',
    })

    return options
  } catch (error: any) {
    await logAuditEvent(event, {
      userId: user.id,
      action: '2fa.registration_initiated',
      resource: `user:${user.id}`,
      resourceType: 'user',
      status: 'failure',
      errorMessage: error.message,
    })

    throw createError({
      statusCode: 500,
      message: 'Failed to generate registration options',
    })
  }
})
