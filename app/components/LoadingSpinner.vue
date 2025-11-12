<script setup lang="ts">
defineProps<{
  size?: 'sm' | 'md' | 'lg' | 'xl'
  color?: string
}>()

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
}
</script>

<template>
  <div
    :class="[
      'animate-spin rounded-full border-2 border-current border-t-transparent',
      sizeClasses[size || 'md'],
      color || 'text-primary-600'
    ]"
    role="status"
    aria-label="Loading"
  >
    <span class="sr-only">Loading...</span>
  </div>
</template>
