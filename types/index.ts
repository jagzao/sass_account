export type UserRole = 'contribuyente' | 'contador'

export type DeclaracionEstado = 'pendiente' | 'revision' | 'generada' | 'enviada' | 'incompleta'

export type ColorEstado = 'verde' | 'amarillo' | 'rojo'

export type TipoDocumento = 'factura_xml' | 'factura_pdf' | 'ticket' | 'comprobante'

export type ChecklistTipo = 'cliente' | 'contador'

export interface User {
  id: string
  email: string
  nombre: string
  apellidos: string
  rol: UserRole
  rfc?: string
  telefono?: string
  avatarUrl?: string
  despacho?: string
  regimenFiscal?: string
  contadorAsignadoId?: string
}

export interface DeclaracionMensual {
  id: string
  contribuyenteId: string
  contadorId: string
  mes: number
  anio: number
  estado: DeclaracionEstado
  colorEstado: ColorEstado
  pasoActual: number
  totalPasos: number
  fechaLimite?: Date
  fechaEnviada?: Date
  montoTotal?: number
  impuestoCalculado?: number
  archivoUrl?: string
  observaciones?: string
  createdAt: Date
  updatedAt: Date
}

export interface Factura {
  id: string
  declaracionId: string
  contribuyenteId: string
  tipoDocumento: TipoDocumento
  nombreArchivo: string
  archivoUrl: string
  tamanoBytes?: number
  mimeType?: string
  folio?: string
  rfcEmisor?: string
  monto?: number
  iva?: number
  fechaEmision?: Date
  categoria?: string
  estado: 'pendiente' | 'revisada' | 'rechazada' | 'aprobada'
  notas?: string
  createdAt: Date
  updatedAt: Date
}

export interface ChecklistItem {
  id: string
  declaracionId: string
  titulo: string
  descripcion?: string
  tipo: ChecklistTipo
  completado: boolean
  completadoPorId?: string
  fechaCompletado?: Date
  orden: number
  obligatorio: boolean
}

export interface Comentario {
  id: string
  declaracionId: string
  usuarioId: string
  mensaje: string
  archivoAdjuntoUrl?: string
  archivoAdjuntoNombre?: string
  createdAt: Date
  usuario?: {
    nombre: string
    apellidos: string
    avatarUrl?: string
    rol: UserRole
  }
}

export interface Notificacion {
  id: string
  usuarioId: string
  tipo: 'recordatorio' | 'alerta' | 'actualizacion' | 'comentario'
  titulo: string
  mensaje: string
  leido: boolean
  enlace?: string
  createdAt: Date
}

export interface MonthStatus {
  mes: number
  anio: number
  colorEstado: ColorEstado
  estado: DeclaracionEstado
  declaracionId?: string
}
