import { useDB, schema } from '~/server/db'
import { eq, desc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  if (!event.context.user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'No autenticado'
    })
  }

  const db = useDB()
  const userId = event.context.user.id

  // Obtener declaraciones según el rol
  let declaraciones

  if (event.context.user.rol === 'contribuyente') {
    declaraciones = await db
      .select()
      .from(schema.declaracionesMensuales)
      .where(eq(schema.declaracionesMensuales.contribuyenteId, userId))
      .orderBy(desc(schema.declaracionesMensuales.anio), desc(schema.declaracionesMensuales.mes))
      .all()
  } else {
    // Contador: obtener todas las declaraciones de sus clientes
    declaraciones = await db
      .select()
      .from(schema.declaracionesMensuales)
      .where(eq(schema.declaracionesMensuales.contadorId, userId))
      .orderBy(desc(schema.declaracionesMensuales.anio), desc(schema.declaracionesMensuales.mes))
      .all()
  }

  return { declaraciones }
})
