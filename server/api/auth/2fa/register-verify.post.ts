import { verifyAndStoreRegistration } from '~/server/utils/webauthn'
import { logAuditEvent } from '~/server/utils/audit'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody(event)

  try {
    // Get challenge from session
    const expectedChallenge = event.context.webauthnChallenge
    if (!expectedChallenge) {
      throw new Error('No challenge found in session')
    }

    await verifyAndStoreRegistration(
      user.id,
      body.response,
      expectedChallenge,
      body.deviceName
    )

    await logAuditEvent(event, {
      userId: user.id,
      action: '2fa.device_registered',
      resource: `user:${user.id}`,
      resourceType: 'user',
      metadata: {
        deviceName: body.deviceName || 'Security Key',
      },
    })

    return {
      success: true,
      message: '2FA device registered successfully',
    }
  } catch (error: any) {
    await logAuditEvent(event, {
      userId: user.id,
      action: '2fa.device_registered',
      resource: `user:${user.id}`,
      resourceType: 'user',
      status: 'failure',
      errorMessage: error.message,
    })

    throw createError({
      statusCode: 400,
      message: error.message || 'Failed to register 2FA device',
    })
  }
})
