import { generateIdFromEntropySize } from 'lucia'
import { useDB, schema } from '~/server/db'
import { z } from 'zod'

const comentarioSchema = z.object({
  mensaje: z.string().min(1, 'El mensaje no puede estar vacío')
})

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

  const body = await readBody(event)
  const { mensaje } = comentarioSchema.parse(body)

  const db = useDB()
  const comentarioId = generateIdFromEntropySize(10)

  await db.insert(schema.comentarios).values({
    id: comentarioId,
    declaracionId,
    usuarioId: event.context.user.id,
    mensaje
  })

  // Obtener el comentario con información del usuario
  const nuevoComentario = await db
    .select({
      id: schema.comentarios.id,
      declaracionId: schema.comentarios.declaracionId,
      usuarioId: schema.comentarios.usuarioId,
      mensaje: schema.comentarios.mensaje,
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
    .where(eq(schema.comentarios.id, comentarioId))
    .get()

  return { comentario: nuevoComentario }
})
