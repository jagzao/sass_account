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

    <!-- Header -->
    <div class="flex items-start justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Registro de Actividad
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
          Historial completo de todas las acciones realizadas en tu cuenta
        </p>
      </div>
      <UButton
        icon="i-heroicons-arrow-path"
        color="gray"
        variant="outline"
        :loading="loading"
        @click="loadAuditLogs"
      >
        Actualizar
      </UButton>
    </div>

    <!-- Filters -->
    <div class="card">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <UInput
          v-model="searchQuery"
          placeholder="Buscar acciones..."
          icon="i-heroicons-magnifying-glass"
          size="lg"
        />
        <USelect
          v-model="filterType"
          :options="resourceTypes"
          placeholder="Tipo de recurso"
          size="lg"
        />
        <USelect
          v-model="filterStatus"
          :options="statusOptions"
          placeholder="Estado"
          size="lg"
        />
      </div>
    </div>

    <!-- Audit Logs Table -->
    <div class="card">
      <div v-if="loading && logs.length === 0" class="text-center py-12">
        <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-primary-600 mx-auto mb-4" />
        <p class="text-gray-600 dark:text-gray-400">Cargando registros...</p>
      </div>

      <div v-else-if="filteredLogs.length === 0" class="text-center py-12">
        <UIcon name="i-heroicons-document-text" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p class="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No se encontraron registros
        </p>
        <p class="text-gray-600 dark:text-gray-400">
          {{ searchQuery || filterType || filterStatus ? 'Intenta ajustar los filtros' : 'Aún no hay actividad registrada' }}
        </p>
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="log in paginatedLogs"
          :key="log.id"
          class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <div class="flex items-start justify-between mb-2">
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-full flex items-center justify-center"
                :class="getActionColorClass(log.action, log.status)"
              >
                <UIcon
                  :name="getActionIcon(log.action)"
                  class="w-5 h-5"
                />
              </div>
              <div>
                <h3 class="font-semibold text-gray-900 dark:text-white">
                  {{ getActionLabel(log.action) }}
                </h3>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  {{ formatDate(log.createdAt) }}
                </p>
              </div>
            </div>
            <UBadge
              :color="log.status === 'success' ? 'green' : 'red'"
              variant="soft"
            >
              {{ log.status === 'success' ? 'Éxito' : 'Fallo' }}
            </UBadge>
          </div>

          <div class="ml-13 space-y-1">
            <div class="flex items-center gap-2 text-sm">
              <span class="text-gray-500 dark:text-gray-400">Recurso:</span>
              <span class="font-medium text-gray-900 dark:text-white">{{ log.resource }}</span>
            </div>

            <div v-if="log.ipAddress" class="flex items-center gap-2 text-sm">
              <span class="text-gray-500 dark:text-gray-400">IP:</span>
              <span class="font-mono text-gray-900 dark:text-white">{{ log.ipAddress }}</span>
            </div>

            <div v-if="log.errorMessage" class="flex items-start gap-2 text-sm">
              <span class="text-gray-500 dark:text-gray-400">Error:</span>
              <span class="text-red-600 dark:text-red-400">{{ log.errorMessage }}</span>
            </div>

            <div v-if="log.metadata && Object.keys(log.metadata).length > 0" class="mt-2">
              <UButton
                size="xs"
                variant="ghost"
                color="gray"
                @click="toggleMetadata(log.id)"
              >
                {{ expandedLogs.has(log.id) ? 'Ocultar' : 'Ver' }} detalles
                <UIcon
                  :name="expandedLogs.has(log.id) ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
                  class="w-4 h-4 ml-1"
                />
              </UButton>
              <div
                v-if="expandedLogs.has(log.id)"
                class="mt-2 p-3 bg-gray-100 dark:bg-gray-900 rounded-lg"
              >
                <pre class="text-xs text-gray-700 dark:text-gray-300 overflow-x-auto">{{ JSON.stringify(log.metadata, null, 2) }}</pre>
              </div>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <div class="text-sm text-gray-600 dark:text-gray-400">
            Mostrando {{ (currentPage - 1) * pageSize + 1 }} - {{ Math.min(currentPage * pageSize, filteredLogs.length) }} de {{ filteredLogs.length }} registros
          </div>
          <div class="flex gap-2">
            <UButton
              icon="i-heroicons-chevron-left"
              color="gray"
              variant="outline"
              :disabled="currentPage === 1"
              @click="currentPage--"
            />
            <UButton
              v-for="page in visiblePages"
              :key="page"
              :variant="page === currentPage ? 'solid' : 'outline'"
              :color="page === currentPage ? 'primary' : 'gray'"
              @click="currentPage = page"
            >
              {{ page }}
            </UButton>
            <UButton
              icon="i-heroicons-chevron-right"
              color="gray"
              variant="outline"
              :disabled="currentPage === totalPages"
              @click="currentPage++"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Info Alert -->
    <UAlert
      color="blue"
      variant="soft"
      icon="i-heroicons-information-circle"
      title="Trazabilidad Legal"
    >
      <template #description>
        Todos los registros de actividad se conservan de forma permanente para cumplir con los
        requisitos fiscales y legales. Esta información es confidencial y solo tú puedes verla.
      </template>
    </UAlert>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
})

interface AuditLog {
  id: string
  action: string
  resource: string
  resourceType: string
  metadata?: Record<string, any>
  ipAddress?: string
  userAgent?: string
  status: 'success' | 'failure'
  errorMessage?: string
  createdAt: Date
}

const toast = useToast()

// State
const logs = ref<AuditLog[]>([])
const loading = ref(false)
const searchQuery = ref('')
const filterType = ref('')
const filterStatus = ref('')
const currentPage = ref(1)
const pageSize = 20
const expandedLogs = ref(new Set<string>())

// Options
const resourceTypes = [
  { label: 'Todos los tipos', value: '' },
  { label: 'Usuario', value: 'user' },
  { label: 'Declaración', value: 'declaration' },
  { label: 'Factura', value: 'factura' },
  { label: 'Logs de Auditoría', value: 'audit_logs' },
]

const statusOptions = [
  { label: 'Todos los estados', value: '' },
  { label: 'Éxito', value: 'success' },
  { label: 'Fallo', value: 'failure' },
]

// Computed
const filteredLogs = computed(() => {
  let result = logs.value

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(
      log =>
        log.action.toLowerCase().includes(query) ||
        log.resource.toLowerCase().includes(query) ||
        log.resourceType.toLowerCase().includes(query)
    )
  }

  if (filterType.value) {
    result = result.filter(log => log.resourceType === filterType.value)
  }

  if (filterStatus.value) {
    result = result.filter(log => log.status === filterStatus.value)
  }

  return result
})

const totalPages = computed(() => Math.ceil(filteredLogs.value.length / pageSize))

const paginatedLogs = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  const end = start + pageSize
  return filteredLogs.value.slice(start, end)
})

const visiblePages = computed(() => {
  const pages = []
  const maxVisible = 5
  let start = Math.max(1, currentPage.value - Math.floor(maxVisible / 2))
  let end = Math.min(totalPages.value, start + maxVisible - 1)

  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1)
  }

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  return pages
})

// Methods
const loadAuditLogs = async () => {
  try {
    loading.value = true
    const response = await $fetch('/api/audit-logs')

    logs.value = response.map((log: any) => ({
      ...log,
      createdAt: new Date(log.createdAt),
      metadata: log.metadata ? JSON.parse(log.metadata) : undefined,
    }))
  } catch (error: any) {
    toast.add({
      title: 'Error al cargar registros',
      description: error.message || 'Ocurrió un error al cargar los registros de actividad',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

const toggleMetadata = (logId: string) => {
  if (expandedLogs.value.has(logId)) {
    expandedLogs.value.delete(logId)
  } else {
    expandedLogs.value.add(logId)
  }
}

const getActionIcon = (action: string): string => {
  if (action.includes('login')) return 'i-heroicons-arrow-right-on-rectangle'
  if (action.includes('logout')) return 'i-heroicons-arrow-left-on-rectangle'
  if (action.includes('created') || action.includes('registered')) return 'i-heroicons-plus-circle'
  if (action.includes('updated')) return 'i-heroicons-pencil-square'
  if (action.includes('deleted') || action.includes('removed')) return 'i-heroicons-trash'
  if (action.includes('exported')) return 'i-heroicons-arrow-down-tray'
  if (action.includes('viewed')) return 'i-heroicons-eye'
  if (action.includes('2fa')) return 'i-heroicons-finger-print'
  return 'i-heroicons-document-text'
}

const getActionColorClass = (action: string, status: string): string => {
  if (status === 'failure') return 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400'

  if (action.includes('login') || action.includes('2fa')) return 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
  if (action.includes('created') || action.includes('registered')) return 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400'
  if (action.includes('updated')) return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400'
  if (action.includes('deleted') || action.includes('removed')) return 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400'
  if (action.includes('exported')) return 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400'

  return 'bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400'
}

const getActionLabel = (action: string): string => {
  const labels: Record<string, string> = {
    'user.login_success': 'Inicio de sesión exitoso',
    'user.login_failed': 'Intento de inicio de sesión fallido',
    'user.logout': 'Cierre de sesión',
    'user.created': 'Usuario creado',
    'user.updated': 'Usuario actualizado',
    'user.deleted': 'Usuario eliminado',
    'declaration.created': 'Declaración creada',
    'declaration.updated': 'Declaración actualizada',
    'declaration.deleted': 'Declaración eliminada',
    'declaration.exported': 'Declaración exportada',
    'factura.created': 'Factura creada',
    'factura.updated': 'Factura actualizada',
    'factura.deleted': 'Factura eliminada',
    'audit_logs.viewed': 'Consulta de registro de actividad',
    '2fa.registration_initiated': 'Registro de 2FA iniciado',
    '2fa.device_registered': 'Dispositivo 2FA registrado',
    '2fa.device_removed': 'Dispositivo 2FA eliminado',
    '2fa.authentication_success': 'Autenticación 2FA exitosa',
    '2fa.authentication_failed': 'Autenticación 2FA fallida',
  }

  return labels[action] || action
}

const formatDate = (date: Date) => {
  return new Date(date).toLocaleString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// Watch for filter changes to reset pagination
watch([searchQuery, filterType, filterStatus], () => {
  currentPage.value = 1
})

// Load logs on mount
onMounted(() => {
  loadAuditLogs()
})
</script>
