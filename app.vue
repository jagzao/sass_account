<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
// App-wide setup
useHead({
  htmlAttrs: {
    lang: 'es'
  }
})
</script>
