import { getUserAuthenticators } from '~/server/utils/webauthn'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  try {
    const devices = await getUserAuthenticators(user.id)
    return devices
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch 2FA devices',
    })
  }
})
