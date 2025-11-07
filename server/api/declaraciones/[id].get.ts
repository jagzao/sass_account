import { useDB, schema } from '~/server/db'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  if (!event.context.user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'No autenticado'
    })
  }

  const declaracionId = getRouterParam(event, 'id')
  if (!declaracionId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID de declaración requerido'
    })
  }

  const db = useDB()

  const declaracion = await db
    .select()
    .from(schema.declaracionesMensuales)
    .where(eq(schema.declaracionesMensuales.id, declaracionId))
    .get()

  if (!declaracion) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Declaración no encontrada'
    })
  }

  // Verificar acceso
  const userId = event.context.user.id
  if (
    declaracion.contribuyenteId !== userId &&
    declaracion.contadorId !== userId
  ) {
    throw createError({
      statusCode: 403,
      statusMessage: 'No tienes permiso para ver esta declaración'
    })
  }

  return { declaracion }
})
