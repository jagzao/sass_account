<template>
  <div
    :class="[
      'status-circle',
      colorClass
    ]"
    :title="tooltip"
  >
    <UIcon :name="icon" class="w-5 h-5" />
  </div>
</template>

<script setup lang="ts">
import type { ColorEstado } from '~/types'

const props = defineProps<{
  color: ColorEstado
  tooltip?: string
}>()

const colorClass = computed(() => {
  const colorMap: Record<ColorEstado, string> = {
    verde: 'green',
    amarillo: 'yellow',
    rojo: 'red'
  }
  return colorMap[props.color] || 'gray'
})

const icon = computed(() => {
  const iconMap: Record<string, string> = {
    green: 'i-heroicons-check',
    yellow: 'i-heroicons-exclamation-triangle',
    red: 'i-heroicons-x-mark'
  }
  return iconMap[colorClass.value] || 'i-heroicons-question-mark-circle'
})
</script>
