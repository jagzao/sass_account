<template>
  <div>
    <!-- Dashboard de Contribuyente -->
    <DashboardContribuyente v-if="isContribuyente" />

    <!-- Dashboard de Contador -->
    <DashboardContador v-else-if="isContador" />
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
})

const { isContribuyente, isContador } = useAuth()
</script>
