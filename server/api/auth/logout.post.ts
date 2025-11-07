import { initializeLucia } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  if (!event.context.session) {
    throw createError({
      statusCode: 401,
      statusMessage: 'No autorizado'
    })
  }

  const lucia = initializeLucia(event.context.cloudflare.env.DB)
  await lucia.invalidateSession(event.context.session.id)

  appendResponseHeader(
    event,
    'Set-Cookie',
    lucia.createBlankSessionCookie().serialize()
  )

  return { success: true }
})
