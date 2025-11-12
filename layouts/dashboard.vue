<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <header class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
      <div class="container mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <!-- Logo -->
          <NuxtLink to="/dashboard" class="flex items-center gap-2">
            <UIcon name="i-heroicons-document-chart-bar" class="w-8 h-8 text-primary-600" />
            <span class="text-xl font-bold text-gray-900 dark:text-white">
              Fiscal Pro
            </span>
          </NuxtLink>

          <!-- User menu -->
          <div class="flex items-center gap-4">
            <!-- Notificaciones -->
            <UButton
              icon="i-heroicons-bell"
              color="gray"
              variant="ghost"
              :ui="{ rounded: 'rounded-full' }"
            />

            <!-- User dropdown -->
            <UDropdown
              :items="userMenuItems"
              :popper="{ placement: 'bottom-end' }"
            >
              <UAvatar
                :src="user?.avatarUrl"
                :alt="`${user?.nombre} ${user?.apellidos}`"
                size="md"
                class="cursor-pointer"
              />
            </UDropdown>
          </div>
        </div>
      </div>
    </header>

    <!-- Main content -->
    <main class="container mx-auto px-4 py-8">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
const { user, logout } = useAuth()

const userMenuItems = [
  [{
    label: user.value?.email || '',
    slot: 'account',
    disabled: true
  }],
  [{
    label: 'Perfil',
    icon: 'i-heroicons-user-circle',
    to: '/dashboard/perfil'
  }, {
    label: 'Seguridad (2FA)',
    icon: 'i-heroicons-finger-print',
    to: '/dashboard/settings'
  }, {
    label: 'Registro de Actividad',
    icon: 'i-heroicons-clock',
    to: '/dashboard/audit-logs'
  }],
  [{
    label: 'Cerrar sesión',
    icon: 'i-heroicons-arrow-right-on-rectangle',
    click: logout
  }]
]
</script>
