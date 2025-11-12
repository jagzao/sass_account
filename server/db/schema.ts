import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

// Usuarios (contribuyentes y contadores)
export const usuarios = sqliteTable('usuarios', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  hashedPassword: text('hashed_password').notNull(),
  nombre: text('nombre').notNull(),
  apellidos: text('apellidos').notNull(),
  telefono: text('telefono'),
  rfc: text('rfc'),
  rol: text('rol', { enum: ['contribuyente', 'contador'] }).notNull(),
  avatarUrl: text('avatar_url'),
  despacho: text('despacho'), // Solo para contadores
  regimenFiscal: text('regimen_fiscal'), // Solo para contribuyentes
  contadorAsignadoId: text('contador_asignado_id').references(() => usuarios.id),
  activo: integer('activo', { mode: 'boolean' }).default(true).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`)
})

// Sesiones de autenticación (Lucia)
export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => usuarios.id, { onDelete: 'cascade' }),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull()
})

// Declaraciones mensuales
export const declaracionesMensuales = sqliteTable('declaraciones_mensuales', {
  id: text('id').primaryKey(),
  contribuyenteId: text('contribuyente_id').notNull().references(() => usuarios.id, { onDelete: 'cascade' }),
  contadorId: text('contador_id').notNull().references(() => usuarios.id),
  mes: integer('mes').notNull(), // 1-12
  anio: integer('anio').notNull(),
  estado: text('estado', {
    enum: ['pendiente', 'revision', 'generada', 'enviada', 'incompleta']
  }).notNull().default('pendiente'),
  colorEstado: text('color_estado', { enum: ['verde', 'amarillo', 'rojo'] }).notNull().default('rojo'),
  pasoActual: integer('paso_actual').notNull().default(1), // 1-4
  totalPasos: integer('total_pasos').notNull().default(4),
  fechaLimite: integer('fecha_limite', { mode: 'timestamp' }),
  fechaEnviada: integer('fecha_enviada', { mode: 'timestamp' }),
  montoTotal: real('monto_total').default(0),
  impuestoCalculado: real('impuesto_calculado').default(0),
  archivoUrl: text('archivo_url'), // URL del archivo PDF de la declaración
  observaciones: text('observaciones'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`)
})

// Facturas y documentos
export const facturas = sqliteTable('facturas', {
  id: text('id').primaryKey(),
  declaracionId: text('declaracion_id').notNull().references(() => declaracionesMensuales.id, { onDelete: 'cascade' }),
  contribuyenteId: text('contribuyente_id').notNull().references(() => usuarios.id),
  tipoDocumento: text('tipo_documento', {
    enum: ['factura_xml', 'factura_pdf', 'ticket', 'comprobante']
  }).notNull(),
  nombreArchivo: text('nombre_archivo').notNull(),
  archivoUrl: text('archivo_url').notNull(),
  tamanoBytes: integer('tamano_bytes'),
  mimeType: text('mime_type'),
  folio: text('folio'),
  rfcEmisor: text('rfc_emisor'),
  monto: real('monto'),
  iva: real('iva'),
  fechaEmision: integer('fecha_emision', { mode: 'timestamp' }),
  categoria: text('categoria'), // ingresos, gastos, deducciones
  estado: text('estado', { enum: ['pendiente', 'revisada', 'rechazada', 'aprobada'] }).notNull().default('pendiente'),
  notas: text('notas'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`)
})

// Checklist items
export const checklistItems = sqliteTable('checklist_items', {
  id: text('id').primaryKey(),
  declaracionId: text('declaracion_id').notNull().references(() => declaracionesMensuales.id, { onDelete: 'cascade' }),
  titulo: text('titulo').notNull(),
  descripcion: text('descripcion'),
  tipo: text('tipo', { enum: ['cliente', 'contador'] }).notNull(),
  completado: integer('completado', { mode: 'boolean' }).notNull().default(false),
  completadoPorId: text('completado_por_id').references(() => usuarios.id),
  fechaCompletado: integer('fecha_completado', { mode: 'timestamp' }),
  orden: integer('orden').notNull().default(0),
  obligatorio: integer('obligatorio', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`)
})

// Comentarios (chat por mes)
export const comentarios = sqliteTable('comentarios', {
  id: text('id').primaryKey(),
  declaracionId: text('declaracion_id').notNull().references(() => declaracionesMensuales.id, { onDelete: 'cascade' }),
  usuarioId: text('usuario_id').notNull().references(() => usuarios.id),
  mensaje: text('mensaje').notNull(),
  archivoAdjuntoUrl: text('archivo_adjunto_url'),
  archivoAdjuntoNombre: text('archivo_adjunto_nombre'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`)
})

// Notificaciones
export const notificaciones = sqliteTable('notificaciones', {
  id: text('id').primaryKey(),
  usuarioId: text('usuario_id').notNull().references(() => usuarios.id, { onDelete: 'cascade' }),
  tipo: text('tipo', {
    enum: ['recordatorio', 'alerta', 'actualizacion', 'comentario']
  }).notNull(),
  titulo: text('titulo').notNull(),
  mensaje: text('mensaje').notNull(),
  leido: integer('leido', { mode: 'boolean' }).notNull().default(false),
  enlace: text('enlace'), // URL para redirigir al hacer clic
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`)
})

// Audit Logs (trazabilidad legal)
export const auditLogs = sqliteTable('audit_logs', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => usuarios.id, { onDelete: 'cascade' }),
  action: text('action').notNull(), // login, logout, create, update, delete, etc.
  resource: text('resource').notNull(), // user:123, declaration:456, etc.
  resourceType: text('resource_type').notNull(), // user, declaration, factura, etc.
  metadata: text('metadata'), // JSON stringified data
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  status: text('status', { enum: ['success', 'failure'] }).notNull().default('success'),
  errorMessage: text('error_message'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`)
})

// Authenticators para 2FA (WebAuthn)
export const authenticators = sqliteTable('authenticators', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => usuarios.id, { onDelete: 'cascade' }),
  credentialId: text('credential_id').notNull().unique(), // Base64 encoded
  credentialPublicKey: text('credential_public_key').notNull(), // Base64 encoded
  counter: integer('counter').notNull().default(0),
  transports: text('transports'), // JSON array: ["usb", "nfc", "ble", "internal"]
  deviceName: text('device_name'), // Optional user-friendly name
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  lastUsedAt: integer('last_used_at', { mode: 'timestamp' })
})

// Tipos TypeScript inferidos
export type Usuario = typeof usuarios.$inferSelect
export type NuevoUsuario = typeof usuarios.$inferInsert
export type Session = typeof sessions.$inferSelect
export type DeclaracionMensual = typeof declaracionesMensuales.$inferSelect
export type NuevaDeclaracionMensual = typeof declaracionesMensuales.$inferInsert
export type Factura = typeof facturas.$inferSelect
export type NuevaFactura = typeof facturas.$inferInsert
export type ChecklistItem = typeof checklistItems.$inferSelect
export type NuevoChecklistItem = typeof checklistItems.$inferInsert
export type Comentario = typeof comentarios.$inferSelect
export type NuevoComentario = typeof comentarios.$inferInsert
export type Notificacion = typeof notificaciones.$inferSelect
export type NuevaNotificacion = typeof notificaciones.$inferInsert
export type AuditLog = typeof auditLogs.$inferSelect
export type NuevoAuditLog = typeof auditLogs.$inferInsert
export type Authenticator = typeof authenticators.$inferSelect
export type NuevoAuthenticator = typeof authenticators.$inferInsert
