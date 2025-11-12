<script setup lang="ts">
import { useToast } from '~/composables/useAtoms'

const { toasts, removeToast } = useToast()

const getToastColor = (type: string) => {
  switch (type) {
    case 'success':
      return 'green'
    case 'error':
      return 'red'
    case 'warning':
      return 'yellow'
    case 'info':
    default:
      return 'blue'
  }
}

const getToastIcon = (type: string) => {
  switch (type) {
    case 'success':
      return 'i-heroicons-check-circle'
    case 'error':
      return 'i-heroicons-x-circle'
    case 'warning':
      return 'i-heroicons-exclamation-triangle'
    case 'info':
    default:
      return 'i-heroicons-information-circle'
  }
}
</script>

<template>
  <div class="toast-container fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md">
    <TransitionGroup name="toast">
      <UCard
        v-for="toast in toasts"
        :key="toast.id"
        :ui="{
          base: 'shadow-lg',
          background: `bg-${getToastColor(toast.type)}-50 dark:bg-${getToastColor(toast.type)}-900/20`,
          ring: `ring-1 ring-${getToastColor(toast.type)}-200 dark:ring-${getToastColor(toast.type)}-800`
        }"
      >
        <div class="flex items-start gap-3">
          <UIcon
            :name="getToastIcon(toast.type)"
            :class="`text-${getToastColor(toast.type)}-500 dark:text-${getToastColor(toast.type)}-400`"
            class="w-5 h-5 mt-0.5"
          />
          <div class="flex-1">
            <p :class="`text-sm text-${getToastColor(toast.type)}-900 dark:text-${getToastColor(toast.type)}-100`">
              {{ toast.message }}
            </p>
          </div>
          <UButton
            :color="getToastColor(toast.type)"
            variant="ghost"
            icon="i-heroicons-x-mark"
            size="xs"
            @click="removeToast(toast.id)"
          />
        </div>
      </UCard>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>
