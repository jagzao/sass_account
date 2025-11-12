<template>
  <div class="space-y-6">
    <!-- Breadcrumb -->
    <nav class="flex items-center gap-2 text-sm">
      <UButton
        to="/dashboard"
        variant="link"
        color="gray"
        icon="i-heroicons-arrow-left"
      >
        Volver
      </UButton>
    </nav>

    <!-- Header con estado del mes -->
    <div class="card">
      <div class="flex items-start justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Declaración de {{ mesNombre }} {{ declaracion.anio }}
          </h1>
          <div class="flex items-center gap-3">
            <StatusCircle :color="declaracion.colorEstado" />
            <span class="text-lg font-medium" :class="estadoColorClass">
              {{ estadoLabel }}
            </span>
          </div>
        </div>
        <UButton
          v-if="isContador"
          icon="i-heroicons-document-arrow-down"
          color="primary"
          @click="exportarPDF"
          :loading="exportandoPDF"
        >
          Generar PDF
        </UButton>
      </div>

      <!-- Barra de progreso -->
      <ProgressBar
        :current-step="declaracion.pasoActual"
        :total-steps="declaracion.totalPasos"
        :step-labels="['Facturas', 'Revisión', 'Declaración', 'Enviada']"
      />
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Columna principal -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Checklists -->
        <div class="card">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Lista de Tareas
          </h2>

          <!-- Checklist Cliente -->
          <UAccordion
            :items="[{
              label: 'Tareas del Cliente',
              icon: 'i-heroicons-user',
              defaultOpen: true,
              slot: 'cliente'
            }]"
            class="mb-4"
          >
            <template #cliente>
              <div class="space-y-2 p-4">
                <div
                  v-for="item in checklistCliente"
                  :key="item.id"
                  class="flex items-start gap-3"
                >
                  <UCheckbox
                    :model-value="item.completado"
                    :disabled="isContador && !item.completado"
                    @update:model-value="(val) => toggleChecklistItem(item.id, val)"
                  />
                  <div class="flex-1">
                    <p class="font-medium text-gray-900 dark:text-white">
                      {{ item.titulo }}
                    </p>
                    <p v-if="item.descripcion" class="text-sm text-gray-600 dark:text-gray-400">
                      {{ item.descripcion }}
                    </p>
                    <p v-if="item.completado && item.fechaCompletado" class="text-xs text-green-600 dark:text-green-400 mt-1">
                      Completado el {{ formatDate(item.fechaCompletado) }}
                    </p>
                  </div>
                </div>
              </div>
            </template>
          </UAccordion>

          <!-- Checklist Contador -->
          <UAccordion
            :items="[{
              label: 'Tareas del Contador',
              icon: 'i-heroicons-calculator',
              defaultOpen: true,
              slot: 'contador'
            }]"
          >
            <template #contador>
              <div class="space-y-2 p-4">
                <div
                  v-for="item in checklistContador"
                  :key="item.id"
                  class="flex items-start gap-3"
                >
                  <UCheckbox
                    :model-value="item.completado"
                    :disabled="isContribuyente && !item.completado"
                    @update:model-value="(val) => toggleChecklistItem(item.id, val)"
                  />
                  <div class="flex-1">
                    <p class="font-medium text-gray-900 dark:text-white">
                      {{ item.titulo }}
                    </p>
                    <p v-if="item.descripcion" class="text-sm text-gray-600 dark:text-gray-400">
                      {{ item.descripcion }}
                    </p>
                    <p v-if="item.completado && item.fechaCompletado" class="text-xs text-green-600 dark:text-green-400 mt-1">
                      Completado el {{ formatDate(item.fechaCompletado) }}
                    </p>
                  </div>
                </div>
              </div>
            </template>
          </UAccordion>
        </div>

        <!-- Facturas -->
        <div class="card">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
              Facturas y Documentos
            </h2>
            <UButton
              v-if="isContribuyente"
              icon="i-heroicons-plus"
              color="primary"
              @click="modalFacturas = true"
            >
              Subir Factura
            </UButton>
          </div>

          <div class="space-y-2">
            <div
              v-for="factura in facturas"
              :key="factura.id"
              class="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <div class="flex items-center gap-3">
                <UIcon
                  :name="getFileIcon(factura.tipoDocumento)"
                  class="w-8 h-8"
                  :class="getFileColorClass(factura.tipoDocumento)"
                />
                <div>
                  <p class="font-medium text-gray-900 dark:text-white">
                    {{ factura.nombreArchivo }}
                  </p>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    {{ formatCurrency(factura.monto) }} | {{ formatDate(factura.createdAt) }}
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <UBadge :color="getEstadoColor(factura.estado)">
                  {{ getEstadoLabel(factura.estado) }}
                </UBadge>
                <UButton
                  icon="i-heroicons-eye"
                  color="gray"
                  variant="ghost"
                  size="sm"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Columna lateral - Chat -->
      <div class="lg:col-span-1">
        <div class="card sticky top-24 max-h-[calc(100vh-8rem)] flex flex-col">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Comentarios
          </h2>

          <!-- Mensajes -->
          <div class="flex-1 overflow-y-auto space-y-3 mb-4" ref="chatContainer">
            <div
              v-for="comentario in comentarios"
              :key="comentario.id"
              class="chat-message"
              :class="{ own: comentario.usuarioId === user?.id }"
            >
              <UAvatar
                :src="comentario.usuario?.avatarUrl"
                :alt="comentario.usuario?.nombre"
                size="sm"
              />
              <div class="flex-1">
                <div class="flex items-baseline gap-2">
                  <span class="font-medium text-sm text-gray-900 dark:text-white">
                    {{ comentario.usuario?.nombre }}
                  </span>
                  <span class="text-xs text-gray-500">
                    {{ formatTime(comentario.createdAt) }}
                  </span>
                </div>
                <p class="text-sm text-gray-700 dark:text-gray-300 mt-1">
                  {{ comentario.mensaje }}
                </p>
                <a
                  v-if="comentario.archivoAdjuntoUrl"
                  :href="comentario.archivoAdjuntoUrl"
                  target="_blank"
                  class="text-xs text-primary-600 hover:text-primary-700 mt-1 inline-flex items-center gap-1"
                >
                  <UIcon name="i-heroicons-paper-clip" class="w-3 h-3" />
                  {{ comentario.archivoAdjuntoNombre }}
                </a>
              </div>
            </div>
          </div>

          <!-- Input de mensaje -->
          <div class="border-t border-gray-200 dark:border-gray-700 pt-4">
            <UForm :state="{ mensaje: nuevoMensaje }" @submit="enviarMensaje">
              <div class="flex gap-2">
                <UInput
                  v-model="nuevoMensaje"
                  placeholder="Escribe un comentario..."
                  size="md"
                  class="flex-1"
                />
                <UButton
                  type="submit"
                  icon="i-heroicons-paper-airplane"
                  color="primary"
                  :disabled="!nuevoMensaje.trim()"
                />
              </div>
            </UForm>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal para subir facturas -->
    <UModal v-model="modalFacturas">
      <div class="p-6">
        <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Subir Factura
        </h3>
        <!-- Aquí iría el componente de carga de facturas -->
        <p class="text-gray-600 dark:text-gray-400">
          Componente de carga de facturas (por implementar en siguiente paso)
        </p>
        <div class="flex justify-end gap-2 mt-6">
          <UButton color="gray" variant="outline" @click="modalFacturas = false">
            Cancelar
          </UButton>
          <UButton color="primary" @click="modalFacturas = false">
            Cerrar
          </UButton>
        </div>
      </div>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { DeclaracionMensual, ChecklistItem, Factura, Comentario } from '~/types'

definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
})

const route = useRoute()
const { user, isContador, isContribuyente } = useAuth()
const { getMesNombre, getEstadoLabel: getDeclaracionEstadoLabel } = useDeclaraciones()

const declaracionId = route.params.id as string

// Mock data - en producción vendría de la API
const declaracion = ref<DeclaracionMensual>({
  id: declaracionId,
  contribuyenteId: '1',
  contadorId: '2',
  mes: 12,
  anio: 2025,
  estado: 'revision',
  colorEstado: 'amarillo',
  pasoActual: 2,
  totalPasos: 4,
  createdAt: new Date(),
  updatedAt: new Date()
})

const checklistCliente = ref<ChecklistItem[]>([
  {
    id: '1',
    declaracionId: declaracionId,
    titulo: 'Subir facturas de ingresos',
    descripcion: 'Todas las facturas emitidas en el mes',
    tipo: 'cliente',
    completado: true,
    fechaCompletado: new Date('2025-01-05'),
    orden: 1,
    obligatorio: true
  },
  {
    id: '2',
    declaracionId: declaracionId,
    titulo: 'Confirmar deducciones',
    descripcion: 'Revisar y aprobar gastos deducibles',
    tipo: 'cliente',
    completado: false,
    orden: 2,
    obligatorio: true
  }
])

const checklistContador = ref<ChecklistItem[]>([
  {
    id: '3',
    declaracionId: declaracionId,
    titulo: 'Revisar facturas',
    descripcion: 'Validar la información de las facturas',
    tipo: 'contador',
    completado: true,
    fechaCompletado: new Date('2025-01-06'),
    orden: 1,
    obligatorio: true
  },
  {
    id: '4',
    declaracionId: declaracionId,
    titulo: 'Calcular impuestos',
    descripcion: 'Determinar el monto a pagar o devolver',
    tipo: 'contador',
    completado: false,
    orden: 2,
    obligatorio: true
  }
])

const facturas = ref<Factura[]>([
  {
    id: '1',
    declaracionId: declaracionId,
    contribuyenteId: '1',
    tipoDocumento: 'factura_xml',
    nombreArchivo: 'factura_001.xml',
    archivoUrl: '/files/factura_001.xml',
    monto: 15000,
    estado: 'aprobada',
    createdAt: new Date('2025-01-05'),
    updatedAt: new Date('2025-01-05')
  },
  {
    id: '2',
    declaracionId: declaracionId,
    contribuyenteId: '1',
    tipoDocumento: 'factura_pdf',
    nombreArchivo: 'factura_002.pdf',
    archivoUrl: '/files/factura_002.pdf',
    monto: 8500,
    estado: 'revisada',
    createdAt: new Date('2025-01-06'),
    updatedAt: new Date('2025-01-06')
  }
])

const comentarios = ref<Comentario[]>([
  {
    id: '1',
    declaracionId: declaracionId,
    usuarioId: '2',
    mensaje: 'He revisado las facturas, todo está en orden. Solo falta confirmar las deducciones.',
    createdAt: new Date('2025-01-06T10:30:00'),
    usuario: {
      nombre: 'Juan',
      apellidos: 'Pérez',
      rol: 'contador'
    }
  }
])

const nuevoMensaje = ref('')
const modalFacturas = ref(false)
const chatContainer = ref<HTMLElement>()
const exportandoPDF = ref(false)
const toast = useToast()

const mesNombre = computed(() => getMesNombre(declaracion.value.mes))
const estadoLabel = computed(() => getDeclaracionEstadoLabel(declaracion.value.estado))
const estadoColorClass = computed(() => {
  const colorMap: Record<string, string> = {
    verde: 'text-green-600 dark:text-green-400',
    amarillo: 'text-yellow-600 dark:text-yellow-400',
    rojo: 'text-red-600 dark:text-red-400'
  }
  return colorMap[declaracion.value.colorEstado] || 'text-gray-600'
})

const toggleChecklistItem = async (itemId: string, completado: boolean) => {
  // En producción, esto haría una llamada a la API
  const item = [...checklistCliente.value, ...checklistContador.value].find(i => i.id === itemId)
  if (item) {
    item.completado = completado
    item.fechaCompletado = completado ? new Date() : undefined
    item.completadoPorId = completado ? user.value?.id : undefined
  }
}

const exportarPDF = async () => {
  try {
    exportandoPDF.value = true

    // Open the export endpoint in a new window
    // The HTML will load with a print button, allowing the user to save as PDF
    const url = `/api/declaraciones/${declaracionId}/export-pdf`
    window.open(url, '_blank')

    toast.add({
      title: 'PDF generado',
      description: 'El documento se ha abierto en una nueva pestaña. Use el botón de imprimir para guardarlo como PDF.',
      color: 'success'
    })
  } catch (error: any) {
    toast.add({
      title: 'Error al generar PDF',
      description: error.message || 'Ocurrió un error al generar el PDF',
      color: 'error'
    })
  } finally {
    exportandoPDF.value = false
  }
}

const enviarMensaje = async () => {
  if (!nuevoMensaje.value.trim()) return

  // En producción, esto haría una llamada a la API
  comentarios.value.push({
    id: Date.now().toString(),
    declaracionId: declaracionId,
    usuarioId: user.value!.id,
    mensaje: nuevoMensaje.value,
    createdAt: new Date(),
    usuario: {
      nombre: user.value!.nombre,
      apellidos: user.value!.apellidos,
      avatarUrl: user.value!.avatarUrl,
      rol: user.value!.rol
    }
  })

  nuevoMensaje.value = ''

  // Scroll al final del chat
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight
    }
  })
}

const getFileIcon = (tipo: string) => {
  const iconMap: Record<string, string> = {
    factura_xml: 'i-heroicons-document-text',
    factura_pdf: 'i-heroicons-document',
    ticket: 'i-heroicons-receipt-percent',
    comprobante: 'i-heroicons-document-check'
  }
  return iconMap[tipo] || 'i-heroicons-document'
}

const getFileColorClass = (tipo: string) => {
  const colorMap: Record<string, string> = {
    factura_xml: 'text-blue-600',
    factura_pdf: 'text-red-600',
    ticket: 'text-green-600',
    comprobante: 'text-purple-600'
  }
  return colorMap[tipo] || 'text-gray-600'
}

const getEstadoColor = (estado: string) => {
  const colorMap: Record<string, string> = {
    pendiente: 'gray',
    revisada: 'blue',
    rechazada: 'red',
    aprobada: 'green'
  }
  return colorMap[estado] || 'gray'
}

const getEstadoLabel = (estado: string) => {
  const labelMap: Record<string, string> = {
    pendiente: 'Pendiente',
    revisada: 'Revisada',
    rechazada: 'Rechazada',
    aprobada: 'Aprobada'
  }
  return labelMap[estado] || estado
}

const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const formatTime = (date: Date) => {
  return new Date(date).toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatCurrency = (amount?: number) => {
  if (!amount) return '$0.00'
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(amount)
}
</script>
