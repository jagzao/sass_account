<script setup lang="ts">
defineProps<{
  rows?: number
}>()
</script>

<template>
  <UCard>
    <div class="animate-pulse space-y-4">
      <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
      <div v-for="i in (rows || 3)" :key="i" class="space-y-2">
        <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded" />
        <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
      </div>
    </div>
  </UCard>
</template>
