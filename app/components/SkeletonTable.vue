<script setup lang="ts">
defineProps<{
  rows?: number
  columns?: number
}>()
</script>

<template>
  <div class="animate-pulse">
    <div class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <!-- Header -->
      <div class="bg-gray-50 dark:bg-gray-800 px-6 py-3 border-b border-gray-200 dark:border-gray-700">
        <div class="flex gap-4">
          <div
            v-for="i in (columns || 4)"
            :key="`header-${i}`"
            class="h-4 bg-gray-200 dark:bg-gray-700 rounded flex-1"
          />
        </div>
      </div>

      <!-- Rows -->
      <div
        v-for="row in (rows || 5)"
        :key="`row-${row}`"
        class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0"
      >
        <div class="flex gap-4">
          <div
            v-for="col in (columns || 4)"
            :key="`cell-${row}-${col}`"
            class="h-4 bg-gray-200 dark:bg-gray-700 rounded flex-1"
          />
        </div>
      </div>
    </div>
  </div>
</template>
