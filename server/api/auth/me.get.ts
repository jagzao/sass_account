export default defineEventHandler(async (event) => {
  if (!event.context.user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'No autenticado'
    })
  }

  return {
    user: event.context.user
  }
})
