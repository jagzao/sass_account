import { removeAuthenticator } from '~/server/utils/webauthn'
import { logAuditEvent } from '~/server/utils/audit'

/**
 * Remove a 2FA device
 */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const deviceId = getRouterParam(event, 'id')

  if (!deviceId) {
    throw createError({
      statusCode: 400,
      message: 'Device ID is required',
    })
  }

  try {
    await removeAuthenticator(user.id, deviceId)

    // Log device removal
    await logAuditEvent(event, {
      userId: user.id,
      action: '2fa.device_removed',
      resource: `user:${user.id}`,
      resourceType: 'user',
      metadata: {
        deviceId,
      },
    })

    return { success: true }
  } catch (error: any) {
    await logAuditEvent(event, {
      userId: user.id,
      action: '2fa.device_removed',
      resource: `user:${user.id}`,
      resourceType: 'user',
      status: 'failure',
      errorMessage: error.message,
      metadata: {
        deviceId,
      },
    })

    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to remove device',
    })
  }
})
