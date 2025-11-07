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

  const comentarios = await db
    .select({
      id: schema.comentarios.id,
      declaracionId: schema.comentarios.declaracionId,
      usuarioId: schema.comentarios.usuarioId,
      mensaje: schema.comentarios.mensaje,
      archivoAdjuntoUrl: schema.comentarios.archivoAdjuntoUrl,
      archivoAdjuntoNombre: schema.comentarios.archivoAdjuntoNombre,
      createdAt: schema.comentarios.createdAt,
      usuario: {
        nombre: schema.usuarios.nombre,
        apellidos: schema.usuarios.apellidos,
        avatarUrl: schema.usuarios.avatarUrl,
        rol: schema.usuarios.rol
      }
    })
    .from(schema.comentarios)
    .leftJoin(schema.usuarios, eq(schema.comentarios.usuarioId, schema.usuarios.id))
    .where(eq(schema.comentarios.declaracionId, declaracionId))
    .orderBy(schema.comentarios.createdAt)
    .all()

  return { comentarios }
})
