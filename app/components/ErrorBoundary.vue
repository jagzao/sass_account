<script setup lang="ts">
import * as Sentry from '@sentry/nuxt'

const props = defineProps<{
  fallback?: boolean
}>()

const error = ref<Error | null>(null)
const hasError = ref(false)

const handleError = (err: Error) => {
  error.value = err
  hasError.value = true

  // Report to Sentry
  Sentry.captureException(err)
}

const reset = () => {
  error.value = null
  hasError.value = false
}

// Global error handler
if (import.meta.client) {
  window.addEventListener('error', (event) => {
    handleError(event.error)
  })

  window.addEventListener('unhandledrejection', (event) => {
    handleError(new Error(event.reason))
  })
}
</script>

<template>
  <div>
    <slot v-if="!hasError" :error="handleError" />

    <div v-else-if="fallback" class="error-fallback">
      <div class="max-w-md mx-auto mt-8 p-6 bg-red-50 border border-red-200 rounded-lg">
        <h2 class="text-xl font-bold text-red-800 mb-2">
          Algo salió mal
        </h2>
        <p class="text-red-600 mb-4">
          {{ error?.message || 'Ha ocurrido un error inesperado' }}
        </p>
        <UButton color="red" @click="reset">
          Intentar de nuevo
        </UButton>
      </div>
    </div>

    <slot v-else name="error" :error="error" :reset="reset">
      <div class="error-default">
        <p>Error: {{ error?.message }}</p>
        <button @click="reset">Reintentar</button>
      </div>
    </slot>
  </div>
</template>

<style scoped>
.error-fallback {
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
