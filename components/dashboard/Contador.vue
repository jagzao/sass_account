<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Panel de Contador
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
          {{ user?.despacho || 'Gestiona a tus clientes' }}
        </p>
      </div>
      <UButton
        icon="i-heroicons-plus"
        color="primary"
        size="lg"
      >
        Agregar Cliente
      </UButton>
    </div>

    <!-- Búsqueda y filtros -->
    <div class="card">
      <div class="flex gap-4">
        <UInput
          v-model="busqueda"
          placeholder="Buscar cliente..."
          icon="i-heroicons-magnifying-glass"
          size="lg"
          class="flex-1"
        />
        <USelectMenu
          v-model="filtroEstado"
          :options="estadoOptions"
          placeholder="Todos los estados"
          size="lg"
        />
      </div>
    </div>

    <!-- Lista de clientes -->
    <div class="grid grid-cols-1 gap-4">
      <div
        v-for="cliente in clientesFiltrados"
        :key="cliente.id"
        class="card hover:shadow-md transition-shadow cursor-pointer"
        @click="handleClienteClick(cliente.id)"
      >
        <div class="flex items-center gap-4">
          <!-- Avatar -->
          <UAvatar
            :src="cliente.avatarUrl"
            :alt="`${cliente.nombre} ${cliente.apellidos}`"
            size="lg"
          />

          <!-- Info del cliente -->
          <div class="flex-1">
            <h3 class="font-semibold text-gray-900 dark:text-white">
              {{ cliente.nombre }} {{ cliente.apellidos }}
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              RFC: {{ cliente.rfc }} | {{ cliente.email }}
            </p>
          </div>

          <!-- Estatus mensual -->
          <div class="flex gap-2">
            <StatusCircle
              v-for="mes in cliente.ultimosMeses"
              :key="`${cliente.id}-${mes.mes}`"
              :color="mes.colorEstado"
              :tooltip="`${getMesNombre(mes.mes)}: ${getEstadoLabel(mes.estado)}`"
            />
          </div>

          <!-- Flecha -->
          <UIcon name="i-heroicons-chevron-right" class="w-5 h-5 text-gray-400" />
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="clientesFiltrados.length === 0" class="card text-center py-12">
      <UIcon name="i-heroicons-user-group" class="w-16 h-16 mx-auto text-gray-400 mb-4" />
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        No se encontraron clientes
      </h3>
      <p class="text-gray-600 dark:text-gray-400 mb-6">
        {{ busqueda ? 'Intenta con otro término de búsqueda' : 'Comienza agregando tu primer cliente' }}
      </p>
      <UButton
        v-if="!busqueda"
        icon="i-heroicons-plus"
        color="primary"
      >
        Agregar Cliente
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
const { user } = useAuth()
const { getMesNombre, getEstadoLabel } = useDeclaraciones()
const router = useRouter()

const busqueda = ref('')
const filtroEstado = ref('')

const estadoOptions = [
  { label: 'Todos', value: '' },
  { label: 'Al corriente', value: 'verde' },
  { label: 'Pendiente revisión', value: 'amarillo' },
  { label: 'Con problemas', value: 'rojo' }
]

// Mock data - en producción esto vendría de la API
const clientes = ref([
  {
    id: '1',
    nombre: 'María',
    apellidos: 'González López',
    rfc: 'GOLM850123ABC',
    email: 'maria@email.com',
    avatarUrl: '',
    ultimosMeses: [
      { mes: 10, colorEstado: 'verde' as const, estado: 'enviada' as const },
      { mes: 11, colorEstado: 'verde' as const, estado: 'enviada' as const },
      { mes: 12, colorEstado: 'amarillo' as const, estado: 'revision' as const }
    ]
  },
  {
    id: '2',
    nombre: 'Carlos',
    apellidos: 'Ramírez Sánchez',
    rfc: 'RASC900215XYZ',
    email: 'carlos@email.com',
    avatarUrl: '',
    ultimosMeses: [
      { mes: 10, colorEstado: 'verde' as const, estado: 'enviada' as const },
      { mes: 11, colorEstado: 'rojo' as const, estado: 'incompleta' as const },
      { mes: 12, colorEstado: 'rojo' as const, estado: 'incompleta' as const }
    ]
  },
  {
    id: '3',
    nombre: 'Ana',
    apellidos: 'Martínez Torres',
    rfc: 'MATA951030DEF',
    email: 'ana@email.com',
    avatarUrl: '',
    ultimosMeses: [
      { mes: 10, colorEstado: 'verde' as const, estado: 'enviada' as const },
      { mes: 11, colorEstado: 'verde' as const, estado: 'enviada' as const },
      { mes: 12, colorEstado: 'verde' as const, estado: 'enviada' as const }
    ]
  }
])

const clientesFiltrados = computed(() => {
  let filtered = clientes.value

  // Filtrar por búsqueda
  if (busqueda.value) {
    const search = busqueda.value.toLowerCase()
    filtered = filtered.filter(c =>
      c.nombre.toLowerCase().includes(search) ||
      c.apellidos.toLowerCase().includes(search) ||
      c.rfc.toLowerCase().includes(search) ||
      c.email.toLowerCase().includes(search)
    )
  }

  // Filtrar por estado
  if (filtroEstado.value) {
    filtered = filtered.filter(c =>
      c.ultimosMeses.some(m => m.colorEstado === filtroEstado.value)
    )
  }

  return filtered
})

const handleClienteClick = (clienteId: string) => {
  router.push(`/dashboard/cliente/${clienteId}`)
}
</script>
