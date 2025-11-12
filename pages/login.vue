<template>
  <div class="card">
    <!-- Header -->
    <div class="text-center mb-8">
      <UIcon name="i-heroicons-document-chart-bar" class="w-16 h-16 mx-auto text-primary-600 mb-4" />
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        {{ show2FAStep ? 'Autenticación de Dos Factores' : 'Bienvenido de nuevo' }}
      </h1>
      <p class="text-gray-600 dark:text-gray-400">
        {{ show2FAStep ? 'Usa tu dispositivo de seguridad para completar el inicio de sesión' : 'Ingresa tus credenciales para continuar' }}
      </p>
    </div>

    <!-- 2FA Authentication Step -->
    <div v-if="show2FAStep" class="space-y-6">
      <UAlert
        color="blue"
        variant="soft"
        icon="i-heroicons-finger-print"
        title="Verificación de seguridad requerida"
      >
        <template #description>
          Tu cuenta está protegida con autenticación de dos factores.
          Por favor, usa tu dispositivo de seguridad (YubiKey, Touch ID, Face ID, etc.) para continuar.
        </template>
      </UAlert>

      <div class="flex flex-col items-center gap-4 py-8">
        <UIcon
          name="i-heroicons-finger-print"
          class="w-24 h-24 text-primary-600 animate-pulse"
        />
        <p class="text-center text-gray-600 dark:text-gray-400">
          {{ verifying2FA ? 'Verificando...' : 'Esperando autenticación...' }}
        </p>
      </div>

      <UButton
        color="gray"
        variant="outline"
        block
        @click="cancel2FA"
        :disabled="verifying2FA"
      >
        Cancelar
      </UButton>
    </div>

    <!-- Login Form -->
    <UForm v-else :state="formState" :validate="validate" @submit="handleSubmit" class="space-y-4">
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
import { startAuthentication } from '@simplewebauthn/browser'

definePageMeta({
  layout: 'auth',
  middleware: 'guest'
})

const { login } = useAuth()
const router = useRouter()
const toast = useToast()

const formState = reactive({
  email: '',
  password: ''
})

const showPassword = ref(false)
const loading = ref(false)
const errorMessage = ref('')
const show2FAStep = ref(false)
const verifying2FA = ref(false)
const pendingUserId = ref<string | null>(null)

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

    // Attempt login with email and password
    const response = await $fetch('/api/auth/login', {
      method: 'POST',
      body: { email: event.data.email, password: event.data.password }
    })

    // Check if 2FA is required
    if (response.requires2FA) {
      pendingUserId.value = response.userId
      show2FAStep.value = true

      // Start 2FA authentication flow
      await start2FAAuthentication(response.userId)
    } else {
      // No 2FA required - login successful
      await router.push('/dashboard')
    }
  } catch (error: any) {
    errorMessage.value = error?.data?.statusMessage || 'Error al iniciar sesión'
  } finally {
    loading.value = false
  }
}

const start2FAAuthentication = async (userId: string) => {
  try {
    verifying2FA.value = true

    // Get authentication options from server
    const options = await $fetch('/api/auth/2fa/authenticate-options', {
      method: 'POST',
      body: { userId }
    })

    // Start WebAuthn authentication
    const authenticationResponse = await startAuthentication(options)

    // Verify authentication with server
    const verifyResponse = await $fetch('/api/auth/2fa/authenticate-verify', {
      method: 'POST',
      body: {
        userId,
        response: authenticationResponse,
        expectedChallenge: options.challenge
      }
    })

    if (verifyResponse.success) {
      toast.add({
        title: '¡Inicio de sesión exitoso!',
        description: 'Bienvenido de vuelta',
        color: 'success'
      })

      // Redirect to dashboard
      await router.push('/dashboard')
    }
  } catch (error: any) {
    console.error('2FA authentication error:', error)

    let errorMsg = 'Error en la autenticación de dos factores'

    if (error.name === 'NotAllowedError') {
      errorMsg = 'Autenticación cancelada'
    } else if (error.name === 'NotSupportedError') {
      errorMsg = 'Tu navegador no soporta WebAuthn'
    } else if (error.message) {
      errorMsg = error.message
    }

    toast.add({
      title: 'Error de autenticación',
      description: errorMsg,
      color: 'error'
    })

    // Return to login form
    cancel2FA()
  } finally {
    verifying2FA.value = false
  }
}

const cancel2FA = () => {
  show2FAStep.value = false
  pendingUserId.value = null
  verifying2FA.value = false
  formState.password = '' // Clear password for security
}
</script>
