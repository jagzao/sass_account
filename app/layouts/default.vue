<script setup lang="ts">
// This layout includes the toast container and loading overlay
</script>

<template>
  <div>
    <slot />
    <ToastContainer />
    <LoadingOverlay />
  </div>
</template>
