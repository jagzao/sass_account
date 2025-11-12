<template>
  <div class="space-y-6">
    <!-- Breadcrumb -->
    <nav class="flex items-center gap-2 text-sm">
      <UButton
        to="/dashboard"
        variant="link"
        color="gray"
        icon="i-heroicons-arrow-left"
      >
        Volver
      </UButton>
    </nav>

    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        Configuración de Seguridad
      </h1>
      <p class="text-gray-600 dark:text-gray-400">
        Administra la autenticación de dos factores y la seguridad de tu cuenta
      </p>
    </div>

    <!-- 2FA Section -->
    <div class="card">
      <div class="flex items-start justify-between mb-6">
        <div>
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Autenticación de Dos Factores (2FA)
          </h2>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Protege tu cuenta con dispositivos de seguridad físicos o biométricos (Touch ID, Face ID, YubiKey)
          </p>
        </div>
        <UBadge
          v-if="has2FA"
          color="green"
          variant="soft"
          size="lg"
        >
          Activado
        </UBadge>
        <UBadge
          v-else
          color="red"
          variant="soft"
          size="lg"
        >
          Desactivado
        </UBadge>
      </div>

      <!-- Registered Devices -->
      <div v-if="has2FA && authenticators.length > 0" class="mb-6">
        <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          Dispositivos Registrados
        </h3>
        <div class="space-y-2">
          <div
            v-for="auth in authenticators"
            :key="auth.id"
            class="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
          >
            <div class="flex items-center gap-3">
              <UIcon
                name="i-heroicons-finger-print"
                class="w-6 h-6 text-primary-600"
              />
              <div>
                <p class="font-medium text-gray-900 dark:text-white">
                  {{ auth.deviceName || 'Dispositivo de Seguridad' }}
                </p>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  Registrado el {{ formatDate(auth.createdAt) }}
                  <span v-if="auth.lastUsedAt">
                    · Último uso: {{ formatDate(auth.lastUsedAt) }}
                  </span>
                </p>
              </div>
            </div>
            <UButton
              color="red"
              variant="ghost"
              size="sm"
              icon="i-heroicons-trash"
              :loading="removingDevice === auth.id"
              @click="removeDevice(auth.id)"
            >
              Eliminar
            </UButton>
          </div>
        </div>
      </div>

      <!-- Add Device Button -->
      <div class="flex gap-3">
        <UButton
          icon="i-heroicons-plus"
          color="primary"
          :loading="registering"
          @click="startRegistration"
        >
          Agregar Dispositivo de Seguridad
        </UButton>

        <UButton
          v-if="has2FA"
          icon="i-heroicons-information-circle"
          color="gray"
          variant="outline"
          @click="showInfo = true"
        >
          ¿Cómo funciona?
        </UButton>
      </div>

      <!-- First time info -->
      <UAlert
        v-if="!has2FA"
        color="blue"
        variant="soft"
        icon="i-heroicons-information-circle"
        title="¿Qué es la autenticación de dos factores?"
        class="mt-4"
      >
        <template #description>
          La autenticación de dos factores (2FA) añade una capa adicional de seguridad a tu cuenta.
          Puedes usar dispositivos como YubiKey, Touch ID, Face ID o Windows Hello para verificar tu identidad.
          <br><br>
          <strong>Compatible con:</strong> YubiKey, Touch ID (Mac/iPhone), Face ID (iPhone/iPad), Windows Hello, y otros dispositivos WebAuthn.
        </template>
      </UAlert>
    </div>

    <!-- Device Name Modal -->
    <UModal v-model="showDeviceNameModal">
      <div class="p-6">
        <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Nombre del Dispositivo
        </h3>
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Dale un nombre a tu dispositivo para identificarlo fácilmente
        </p>
        <UInput
          v-model="deviceName"
          placeholder="Ej: YubiKey Personal, Touch ID MacBook Pro"
          size="lg"
          class="mb-6"
          @keyup.enter="completeRegistration"
        />
        <div class="flex justify-end gap-2">
          <UButton
            color="gray"
            variant="outline"
            @click="cancelRegistration"
          >
            Cancelar
          </UButton>
          <UButton
            color="primary"
            :loading="registering"
            @click="completeRegistration"
          >
            Guardar
          </UButton>
        </div>
      </div>
    </UModal>

    <!-- Info Modal -->
    <UModal v-model="showInfo">
      <div class="p-6">
        <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          ¿Cómo funciona la autenticación de dos factores?
        </h3>
        <div class="space-y-4 text-gray-600 dark:text-gray-400">
          <p>
            La autenticación de dos factores (2FA) protege tu cuenta requiriendo dos formas de verificación:
          </p>
          <ol class="list-decimal list-inside space-y-2 ml-2">
            <li>Tu contraseña (algo que sabes)</li>
            <li>Tu dispositivo de seguridad (algo que tienes)</li>
          </ol>
          <p>
            <strong class="text-gray-900 dark:text-white">Dispositivos compatibles:</strong>
          </p>
          <ul class="list-disc list-inside space-y-1 ml-2">
            <li>YubiKey y otras llaves de seguridad USB/NFC</li>
            <li>Touch ID en Mac, iPhone, iPad</li>
            <li>Face ID en iPhone, iPad</li>
            <li>Windows Hello</li>
            <li>Lectores de huellas dactilares Android</li>
          </ul>
          <p>
            <strong class="text-gray-900 dark:text-white">Recomendación:</strong>
            Registra al menos dos dispositivos diferentes para no perder acceso a tu cuenta si pierdes uno.
          </p>
        </div>
        <div class="flex justify-end mt-6">
          <UButton color="primary" @click="showInfo = false">
            Entendido
          </UButton>
        </div>
      </div>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { startRegistration as startWebAuthnRegistration } from '@simplewebauthn/browser'

definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
})

interface Authenticator {
  id: string
  deviceName: string | null
  createdAt: Date
  lastUsedAt: Date | null
}

const toast = useToast()
const { user } = useAuth()

// State
const authenticators = ref<Authenticator[]>([])
const has2FA = computed(() => authenticators.value.length > 0)
const registering = ref(false)
const removingDevice = ref<string | null>(null)
const showDeviceNameModal = ref(false)
const showInfo = ref(false)
const deviceName = ref('')
const pendingRegistrationResponse = ref<any>(null)

// Load authenticators on mount
onMounted(async () => {
  await loadAuthenticators()
})

const loadAuthenticators = async () => {
  try {
    const response = await $fetch('/api/auth/2fa/devices')
    authenticators.value = response.map((auth: any) => ({
      ...auth,
      createdAt: new Date(auth.createdAt),
      lastUsedAt: auth.lastUsedAt ? new Date(auth.lastUsedAt) : null
    }))
  } catch (error: any) {
    console.error('Error loading authenticators:', error)
  }
}

const startRegistration = async () => {
  try {
    registering.value = true

    // Get registration options from server
    const options = await $fetch('/api/auth/2fa/register-options', {
      method: 'POST'
    })

    // Start WebAuthn registration flow
    const registrationResponse = await startWebAuthnRegistration(options)

    // Store response and ask for device name
    pendingRegistrationResponse.value = registrationResponse
    showDeviceNameModal.value = true
  } catch (error: any) {
    console.error('Registration error:', error)

    let errorMessage = 'No se pudo registrar el dispositivo'

    if (error.name === 'NotAllowedError') {
      errorMessage = 'Registro cancelado por el usuario'
    } else if (error.name === 'NotSupportedError') {
      errorMessage = 'Tu navegador no soporta WebAuthn. Usa Chrome, Firefox, Safari o Edge.'
    } else if (error.message) {
      errorMessage = error.message
    }

    toast.add({
      title: 'Error al registrar dispositivo',
      description: errorMessage,
      color: 'error'
    })
  } finally {
    registering.value = false
  }
}

const completeRegistration = async () => {
  if (!pendingRegistrationResponse.value) return

  try {
    registering.value = true

    // Send verification to server
    await $fetch('/api/auth/2fa/register-verify', {
      method: 'POST',
      body: {
        response: pendingRegistrationResponse.value,
        deviceName: deviceName.value || 'Dispositivo de Seguridad'
      }
    })

    toast.add({
      title: '¡Dispositivo registrado!',
      description: 'Tu dispositivo de seguridad ha sido registrado correctamente',
      color: 'success'
    })

    // Reset state and reload
    showDeviceNameModal.value = false
    deviceName.value = ''
    pendingRegistrationResponse.value = null
    await loadAuthenticators()
  } catch (error: any) {
    toast.add({
      title: 'Error al verificar dispositivo',
      description: error.message || 'Ocurrió un error al verificar el dispositivo',
      color: 'error'
    })
  } finally {
    registering.value = false
  }
}

const cancelRegistration = () => {
  showDeviceNameModal.value = false
  deviceName.value = ''
  pendingRegistrationResponse.value = null
  registering.value = false
}

const removeDevice = async (deviceId: string) => {
  if (!confirm('¿Estás seguro de eliminar este dispositivo?')) {
    return
  }

  try {
    removingDevice.value = deviceId

    await $fetch(`/api/auth/2fa/devices/${deviceId}`, {
      method: 'DELETE'
    })

    toast.add({
      title: 'Dispositivo eliminado',
      description: 'El dispositivo ha sido eliminado correctamente',
      color: 'success'
    })

    await loadAuthenticators()
  } catch (error: any) {
    toast.add({
      title: 'Error al eliminar dispositivo',
      description: error.message || 'Ocurrió un error al eliminar el dispositivo',
      color: 'error'
    })
  } finally {
    removingDevice.value = null
  }
}

const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>
