<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800">
    <div class="text-center space-y-6 p-8">
      <UIcon name="i-heroicons-document-chart-bar" class="w-24 h-24 mx-auto text-primary-600" />
      <h1 class="text-4xl font-bold text-gray-900 dark:text-white">
        Plataforma Fiscal Colaborativa
      </h1>
      <p class="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
        Gestión eficiente de declaraciones fiscales entre contadores y contribuyentes
      </p>
      <div class="flex gap-4 justify-center">
        <UButton to="/login" size="lg" color="primary">
          Iniciar Sesión
        </UButton>
        <UButton to="/register" size="lg" variant="outline" color="primary">
          Registrarse
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Página de inicio
definePageMeta({
  layout: 'default'
})
</script>
