import { initializeLucia } from '../utils/auth'

export default defineEventHandler(async (event) => {
  const lucia = initializeLucia(event.context.cloudflare.env.DB)

  const sessionId = getCookie(event, lucia.sessionCookieName) ?? null

  if (!sessionId) {
    event.context.session = null
    event.context.user = null
    return
  }

  const { session, user } = await lucia.validateSession(sessionId)

  if (session && session.fresh) {
    appendResponseHeader(
      event,
      'Set-Cookie',
      lucia.createSessionCookie(session.id).serialize()
    )
  }

  if (!session) {
    appendResponseHeader(
      event,
      'Set-Cookie',
      lucia.createBlankSessionCookie().serialize()
    )
  }

  event.context.session = session
  event.context.user = user
})
