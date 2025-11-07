<template>
  <div class="space-y-2">
    <div class="flex justify-between text-sm">
      <span class="font-medium text-gray-700 dark:text-gray-300">
        Paso {{ currentStep }} de {{ totalSteps }}
      </span>
      <span class="text-gray-500 dark:text-gray-400">
        {{ progressPercentage }}%
      </span>
    </div>
    <div class="flex gap-2">
      <div
        v-for="step in totalSteps"
        :key="step"
        class="progress-step"
        :class="{ completed: step <= currentStep }"
      >
        <div
          class="relative z-10 w-8 h-8 rounded-full flex items-center justify-center"
          :class="
            step <= currentStep
              ? 'bg-primary-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
          "
        >
          <UIcon
            v-if="step < currentStep"
            name="i-heroicons-check"
            class="w-4 h-4"
          />
          <span v-else class="text-xs font-semibold">{{ step }}</span>
        </div>
      </div>
    </div>
    <div v-if="stepLabels" class="flex justify-between text-xs text-gray-500 dark:text-gray-400">
      <span v-for="(label, index) in stepLabels" :key="index" class="flex-1 text-center">
        {{ label }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  currentStep: number
  totalSteps: number
  stepLabels?: string[]
}>()

const progressPercentage = computed(() => {
  return Math.round((props.currentStep / props.totalSteps) * 100)
})
</script>
