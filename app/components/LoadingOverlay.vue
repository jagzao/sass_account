<script setup lang="ts">
import { useLoading } from '~/composables/useAtoms'

const { isLoading } = useLoading()
</script>

<template>
  <Transition name="fade">
    <div
      v-if="isLoading"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
    >
      <div class="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-2xl">
        <LoadingSpinner size="xl" class="mx-auto mb-4" />
        <p class="text-gray-700 dark:text-gray-300 font-medium">
          Cargando...
        </p>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
