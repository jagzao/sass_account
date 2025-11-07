<template>
  <div
    class="card cursor-pointer hover:shadow-md transition-shadow"
    @click="handleClick"
  >
    <div class="flex flex-col items-center gap-2">
      <StatusCircle :color="colorEstado" :tooltip="estadoLabel" />
      <div class="text-center">
        <p class="font-semibold text-gray-900 dark:text-white">
          {{ mesNombre }}
        </p>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          {{ anio }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ColorEstado, DeclaracionEstado } from '~/types'

const props = defineProps<{
  mes: number
  anio: number
  colorEstado: ColorEstado
  estado: DeclaracionEstado
  declaracionId?: string
}>()

const emit = defineEmits<{
  click: [declaracionId?: string]
}>()

const { getMesNombre, getEstadoLabel } = useDeclaraciones()

const mesNombre = computed(() => getMesNombre(props.mes))
const estadoLabel = computed(() => getEstadoLabel(props.estado))

const handleClick = () => {
  emit('click', props.declaracionId)
}
</script>
