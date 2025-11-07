<template>
  <div class="card">
    <!-- Header -->
    <div class="text-center mb-8">
      <UIcon name="i-heroicons-document-chart-bar" class="w-16 h-16 mx-auto text-primary-600 mb-4" />
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        Bienvenido de nuevo
      </h1>
      <p class="text-gray-600 dark:text-gray-400">
        Ingresa tus credenciales para continuar
      </p>
    </div>

    <!-- Login Form -->
    <UForm :state="formState" :validate="validate" @submit="handleSubmit" class="space-y-4">
      <!-- Email -->
      <UFormGroup label="Correo electrónico" name="email" required>
        <UInput
          v-model="formState.email"
          type="email"
          placeholder="tu@email.com"
          icon="i-heroicons-envelope"
          size="lg"
        />
      </UFormGroup>

      <!-- Password -->
      <UFormGroup label="Contraseña" name="password" required>
        <UInput
          v-model="formState.password"
          :type="showPassword ? 'text' : 'password'"
          placeholder="••••••••"
          icon="i-heroicons-lock-closed"
          size="lg"
        >
          <template #trailing>
            <UButton
              :icon="showPassword ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'"
              color="gray"
              variant="link"
              @click="showPassword = !showPassword"
            />
          </template>
        </UInput>
      </UFormGroup>

      <!-- Error message -->
      <UAlert
        v-if="errorMessage"
        color="red"
        variant="soft"
        :title="errorMessage"
        icon="i-heroicons-exclamation-triangle"
        :close-button="{ icon: 'i-heroicons-x-mark', color: 'red', variant: 'link' }"
        @close="errorMessage = ''"
      />

      <!-- Submit button -->
      <UButton
        type="submit"
        color="primary"
        size="lg"
        block
        :loading="loading"
      >
        Iniciar Sesión
      </UButton>

      <!-- Divider -->
      <div class="relative my-6">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-gray-300 dark:border-gray-700" />
        </div>
        <div class="relative flex justify-center text-sm">
          <span class="px-2 bg-white dark:bg-gray-800 text-gray-500">
            ¿No tienes cuenta?
          </span>
        </div>
      </div>

      <!-- Register link -->
      <UButton
        to="/register"
        color="gray"
        variant="outline"
        size="lg"
        block
      >
        Registrarse
      </UButton>
    </UForm>
  </div>
</template>

<script setup lang="ts">
import type { FormSubmitEvent } from '#ui/types'

definePageMeta({
  layout: 'auth',
  middleware: 'guest'
})

const { login } = useAuth()
const router = useRouter()

const formState = reactive({
  email: '',
  password: ''
})

const showPassword = ref(false)
const loading = ref(false)
const errorMessage = ref('')

const validate = (state: typeof formState) => {
  const errors = []
  if (!state.email) errors.push({ path: 'email', message: 'El email es requerido' })
  if (!state.password) errors.push({ path: 'password', message: 'La contraseña es requerida' })
  return errors
}

const handleSubmit = async (event: FormSubmitEvent<typeof formState>) => {
  try {
    loading.value = true
    errorMessage.value = ''

    await login(event.data.email, event.data.password)

    // Redirigir al dashboard
    await router.push('/dashboard')
  } catch (error: any) {
    errorMessage.value = error.message || 'Error al iniciar sesión'
  } finally {
    loading.value = false
  }
}
</script>
