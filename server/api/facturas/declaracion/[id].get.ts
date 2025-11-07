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

  const facturas = await db
    .select()
    .from(schema.facturas)
    .where(eq(schema.facturas.declaracionId, declaracionId))
    .orderBy(schema.facturas.createdAt)
    .all()

  return { facturas }
})
