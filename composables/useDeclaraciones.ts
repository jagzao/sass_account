import type { DeclaracionMensual, MonthStatus } from '~/types'

export const useDeclaraciones = () => {
  const getDeclaracionesByUsuario = async (usuarioId: string) => {
    return await $fetch(`/api/declaraciones/usuario/${usuarioId}`)
  }

  const getDeclaracionById = async (declaracionId: string) => {
    return await $fetch(`/api/declaraciones/${declaracionId}`)
  }

  const createDeclaracion = async (data: Partial<DeclaracionMensual>) => {
    return await $fetch('/api/declaraciones', {
      method: 'POST',
      body: data
    })
  }

  const updateDeclaracion = async (declaracionId: string, data: Partial<DeclaracionMensual>) => {
    return await $fetch(`/api/declaraciones/${declaracionId}`, {
      method: 'PUT',
      body: data
    })
  }

  const getMonthStatuses = (declaraciones: DeclaracionMensual[]): MonthStatus[] => {
    return declaraciones.map(d => ({
      mes: d.mes,
      anio: d.anio,
      colorEstado: d.colorEstado,
      estado: d.estado,
      declaracionId: d.id
    }))
  }

  const getColorClass = (color: string) => {
    const colorMap: Record<string, string> = {
      verde: 'green',
      amarillo: 'yellow',
      rojo: 'red'
    }
    return colorMap[color] || 'gray'
  }

  const getEstadoLabel = (estado: string) => {
    const estadoMap: Record<string, string> = {
      pendiente: 'Pendiente',
      revision: 'En Revisión',
      generada: 'Generada',
      enviada: 'Enviada al SAT',
      incompleta: 'Incompleta'
    }
    return estadoMap[estado] || estado
  }

  const getMesNombre = (mes: number) => {
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ]
    return meses[mes - 1] || ''
  }

  return {
    getDeclaracionesByUsuario,
    getDeclaracionById,
    createDeclaracion,
    updateDeclaracion,
    getMonthStatuses,
    getColorClass,
    getEstadoLabel,
    getMesNombre
  }
}
