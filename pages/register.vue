<template>
  <div class="card max-h-[90vh] overflow-y-auto">
    <!-- Header -->
    <div class="text-center mb-6">
      <UIcon name="i-heroicons-document-chart-bar" class="w-12 h-12 mx-auto text-primary-600 mb-3" />
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        Crear cuenta
      </h1>
      <p class="text-gray-600 dark:text-gray-400">
        Completa el formulario para registrarte
      </p>
    </div>

    <!-- Register Form -->
    <UForm :state="formState" @submit="handleSubmit" class="space-y-4">
      <!-- Rol -->
      <UFormGroup label="Tipo de cuenta" name="rol" required>
        <USelectMenu
          v-model="formState.rol"
          :options="roleOptions"
          placeholder="Selecciona tu rol"
          size="lg"
        />
      </UFormGroup>

      <!-- Nombre -->
      <div class="grid grid-cols-2 gap-4">
        <UFormGroup label="Nombre" name="nombre" required>
          <UInput
            v-model="formState.nombre"
            placeholder="Juan"
            size="lg"
          />
        </UFormGroup>

        <UFormGroup label="Apellidos" name="apellidos" required>
          <UInput
            v-model="formState.apellidos"
            placeholder="Pérez García"
            size="lg"
          />
        </UFormGroup>
      </div>

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
          placeholder="Mínimo 8 caracteres"
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

      <!-- Campos condicionales -->
      <template v-if="formState.rol === 'contribuyente'">
        <UFormGroup label="RFC" name="rfc">
          <UInput
            v-model="formState.rfc"
            placeholder="XAXX010101000"
            size="lg"
          />
        </UFormGroup>

        <UFormGroup label="Régimen Fiscal" name="regimenFiscal">
          <UInput
            v-model="formState.regimenFiscal"
            placeholder="Persona Física con Actividad Empresarial"
            size="lg"
          />
        </UFormGroup>
      </template>

      <template v-if="formState.rol === 'contador'">
        <UFormGroup label="Despacho" name="despacho">
          <UInput
            v-model="formState.despacho"
            placeholder="Nombre de tu despacho"
            size="lg"
          />
        </UFormGroup>
      </template>

      <!-- Teléfono -->
      <UFormGroup label="Teléfono" name="telefono">
        <UInput
          v-model="formState.telefono"
          type="tel"
          placeholder="5551234567"
          icon="i-heroicons-phone"
          size="lg"
        />
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
        Registrarse
      </UButton>

      <!-- Login link -->
      <div class="text-center text-sm text-gray-600 dark:text-gray-400">
        ¿Ya tienes cuenta?
        <UButton to="/login" variant="link" color="primary">
          Iniciar sesión
        </UButton>
      </div>
    </UForm>
  </div>
</template>

<script setup lang="ts">
import type { FormSubmitEvent } from '#ui/types'

definePageMeta({
  layout: 'auth',
  middleware: 'guest'
})

const { register } = useAuth()
const router = useRouter()

const formState = reactive({
  email: '',
  password: '',
  nombre: '',
  apellidos: '',
  rol: 'contribuyente' as 'contribuyente' | 'contador',
  telefono: '',
  rfc: '',
  despacho: '',
  regimenFiscal: ''
})

const roleOptions = [
  { label: 'Contribuyente', value: 'contribuyente' },
  { label: 'Contador', value: 'contador' }
]

const showPassword = ref(false)
const loading = ref(false)
const errorMessage = ref('')

const handleSubmit = async (event: FormSubmitEvent<typeof formState>) => {
  try {
    loading.value = true
    errorMessage.value = ''

    await register(event.data)

    // Redirigir al dashboard
    await router.push('/dashboard')
  } catch (error: any) {
    errorMessage.value = error.message || 'Error al registrarse'
  } finally {
    loading.value = false
  }
}
</script>
