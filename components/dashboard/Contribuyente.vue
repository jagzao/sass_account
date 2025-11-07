<template>
  <div class="space-y-6">
    <!-- Header con información del usuario -->
    <div class="card">
      <div class="flex items-start gap-6">
        <!-- Avatar -->
        <UAvatar
          :src="user?.avatarUrl"
          :alt="`${user?.nombre} ${user?.apellidos}`"
          size="xl"
        />

        <!-- Info del usuario -->
        <div class="flex-1">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Bienvenido, {{ user?.nombre }}
          </h1>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div class="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <UIcon name="i-heroicons-identification" class="w-4 h-4" />
              <span>RFC: {{ user?.rfc || 'No proporcionado' }}</span>
            </div>
            <div class="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <UIcon name="i-heroicons-envelope" class="w-4 h-4" />
              <span>{{ user?.email }}</span>
            </div>
            <div class="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <UIcon name="i-heroicons-phone" class="w-4 h-4" />
              <span>{{ user?.telefono || 'No proporcionado' }}</span>
            </div>
            <div class="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <UIcon name="i-heroicons-briefcase" class="w-4 h-4" />
              <span>{{ user?.regimenFiscal || 'No especificado' }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Selector de vista -->
    <div class="flex justify-between items-center">
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
        Mis Declaraciones
      </h2>
      <USelectMenu
        v-model="vistaActual"
        :options="vistaOptions"
        size="md"
      />
    </div>

    <!-- Vista de calendario (últimos 3 meses) -->
    <div v-if="vistaActual === 'calendario'" class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <MonthCard
        v-for="month in mesesRecientes"
        :key="`${month.anio}-${month.mes}`"
        :mes="month.mes"
        :anio="month.anio"
        :color-estado="month.colorEstado"
        :estado="month.estado"
        :declaracion-id="month.declaracionId"
        @click="handleMonthClick"
      />
    </div>

    <!-- Vista de lista -->
    <div v-else-if="vistaActual === 'lista'" class="card">
      <div class="space-y-3">
        <div
          v-for="month in mesesRecientes"
          :key="`${month.anio}-${month.mes}`"
          class="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
          @click="handleMonthClick(month.declaracionId)"
        >
          <div class="flex items-center gap-4">
            <StatusCircle :color="month.colorEstado" />
            <div>
              <p class="font-semibold text-gray-900 dark:text-white">
                {{ getMesNombre(month.mes) }} {{ month.anio }}
              </p>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ getEstadoLabel(month.estado) }}
              </p>
            </div>
          </div>
          <UIcon name="i-heroicons-chevron-right" class="w-5 h-5 text-gray-400" />
        </div>
      </div>
    </div>

    <!-- Acciones urgentes -->
    <div v-if="accionesUrgentes.length > 0" class="card bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
      <h3 class="text-lg font-semibold text-yellow-900 dark:text-yellow-200 mb-4 flex items-center gap-2">
        <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5" />
        Acciones Urgentes
      </h3>
      <div class="space-y-2">
        <div
          v-for="accion in accionesUrgentes"
          :key="accion.id"
          class="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg"
        >
          <UIcon name="i-heroicons-exclamation-circle" class="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div class="flex-1">
            <p class="font-medium text-gray-900 dark:text-white">{{ accion.titulo }}</p>
            <p class="text-sm text-gray-600 dark:text-gray-400">{{ accion.descripcion }}</p>
          </div>
          <UButton
            color="yellow"
            size="sm"
            @click="handleMonthClick(accion.declaracionId)"
          >
            Ver
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { MonthStatus } from '~/types'

const { user } = useAuth()
const { getMesNombre, getEstadoLabel } = useDeclaraciones()
const router = useRouter()

const vistaActual = ref('calendario')
const vistaOptions = [
  { label: 'Calendario', value: 'calendario' },
  { label: 'Lista', value: 'lista' }
]

// Mock data - en producción esto vendría de la API
const mesesRecientes = ref<MonthStatus[]>([
  {
    mes: 10,
    anio: 2025,
    colorEstado: 'verde',
    estado: 'enviada',
    declaracionId: '1'
  },
  {
    mes: 11,
    anio: 2025,
    colorEstado: 'amarillo',
    estado: 'revision',
    declaracionId: '2'
  },
  {
    mes: 12,
    anio: 2025,
    colorEstado: 'rojo',
    estado: 'incompleta',
    declaracionId: '3'
  }
])

const accionesUrgentes = ref([
  {
    id: '1',
    titulo: 'Faltan facturas - Diciembre 2025',
    descripcion: 'Debes subir tus facturas antes del 15 de enero',
    declaracionId: '3'
  }
])

const handleMonthClick = (declaracionId?: string) => {
  if (declaracionId) {
    router.push(`/dashboard/declaracion/${declaracionId}`)
  }
}
</script>
