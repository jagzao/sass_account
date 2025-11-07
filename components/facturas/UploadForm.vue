<template>
  <div class="space-y-6">
    <!-- Zona de carga drag & drop -->
    <div
      class="border-2 border-dashed rounded-lg p-8 text-center transition-colors"
      :class="isDragging
        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
        : 'border-gray-300 dark:border-gray-700 hover:border-primary-400'
      "
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="handleDrop"
    >
      <UIcon name="i-heroicons-cloud-arrow-up" class="w-16 h-16 mx-auto text-gray-400 mb-4" />
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        Arrastra tus archivos aquí
      </h3>
      <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
        o haz clic para seleccionar archivos
      </p>
      <input
        ref="fileInput"
        type="file"
        multiple
        accept=".xml,.pdf,image/*"
        class="hidden"
        @change="handleFileSelect"
      />
      <UButton
        color="primary"
        @click="fileInput?.click()"
      >
        Seleccionar Archivos
      </UButton>
      <p class="text-xs text-gray-500 dark:text-gray-400 mt-3">
        Formatos soportados: XML, PDF, JPG, PNG (máx. 10MB por archivo)
      </p>
    </div>

    <!-- Opción de escanear con cámara -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <UButton
        icon="i-heroicons-camera"
        color="gray"
        variant="outline"
        size="lg"
        block
        @click="abrirCamara"
      >
        Escanear Ticket
      </UButton>
      <UButton
        icon="i-heroicons-document-text"
        color="gray"
        variant="outline"
        size="lg"
        block
        @click="abrirBuzonSAT"
      >
        Importar del SAT
      </UButton>
    </div>

    <!-- Lista de archivos en cola -->
    <div v-if="archivos.length > 0" class="space-y-3">
      <h3 class="font-semibold text-gray-900 dark:text-white">
        Archivos seleccionados ({{ archivos.length }})
      </h3>
      <div class="space-y-2">
        <div
          v-for="(archivo, index) in archivos"
          :key="index"
          class="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
        >
          <UIcon
            :name="getFileIcon(archivo.file.type)"
            class="w-8 h-8 flex-shrink-0"
            :class="getFileColorClass(archivo.file.type)"
          />
          <div class="flex-1 min-w-0">
            <p class="font-medium text-gray-900 dark:text-white truncate">
              {{ archivo.file.name }}
            </p>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ formatFileSize(archivo.file.size) }}
            </p>
            <!-- Barra de progreso -->
            <div v-if="archivo.uploading" class="mt-2">
              <div class="flex items-center gap-2 text-xs text-gray-500 mb-1">
                <span>Subiendo...</span>
                <span>{{ archivo.progress }}%</span>
              </div>
              <div class="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  class="h-full bg-primary-600 transition-all duration-300"
                  :style="{ width: `${archivo.progress}%` }"
                />
              </div>
            </div>
            <!-- Estado -->
            <div v-else-if="archivo.uploaded" class="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 mt-1">
              <UIcon name="i-heroicons-check-circle" class="w-4 h-4" />
              <span>Subido correctamente</span>
            </div>
            <div v-else-if="archivo.error" class="flex items-center gap-1 text-xs text-red-600 dark:text-red-400 mt-1">
              <UIcon name="i-heroicons-x-circle" class="w-4 h-4" />
              <span>{{ archivo.error }}</span>
            </div>
          </div>
          <UButton
            icon="i-heroicons-x-mark"
            color="gray"
            variant="ghost"
            size="sm"
            :disabled="archivo.uploading"
            @click="eliminarArchivo(index)"
          />
        </div>
      </div>

      <!-- Botones de acción -->
      <div class="flex gap-3 pt-4">
        <UButton
          color="primary"
          size="lg"
          block
          :loading="uploading"
          :disabled="archivos.every(a => a.uploaded)"
          @click="subirArchivos"
        >
          Subir Archivos
        </UButton>
        <UButton
          color="gray"
          variant="outline"
          size="lg"
          :disabled="uploading"
          @click="limpiarArchivos"
        >
          Limpiar
        </UButton>
      </div>
    </div>

    <!-- Modal de cámara -->
    <UModal v-model="modalCamara">
      <div class="p-6">
        <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Escanear Ticket
        </h3>
        <div class="space-y-4">
          <div class="aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
            <UIcon name="i-heroicons-camera" class="w-16 h-16 text-gray-400" />
          </div>
          <p class="text-sm text-gray-600 dark:text-gray-400 text-center">
            Funcionalidad de cámara por implementar
          </p>
          <div class="flex gap-2">
            <UButton color="gray" variant="outline" block @click="modalCamara = false">
              Cancelar
            </UButton>
            <UButton color="primary" block @click="modalCamara = false">
              Capturar
            </UButton>
          </div>
        </div>
      </div>
    </UModal>
  </div>
</template>

<script setup lang="ts">
interface ArchivoEnCola {
  file: File
  uploading: boolean
  uploaded: boolean
  progress: number
  error?: string
}

const props = defineProps<{
  declaracionId: string
}>()

const emit = defineEmits<{
  uploaded: [archivos: File[]]
}>()

const fileInput = ref<HTMLInputElement>()
const archivos = ref<ArchivoEnCola[]>([])
const isDragging = ref(false)
const uploading = ref(false)
const modalCamara = ref(false)

const handleDrop = (event: DragEvent) => {
  isDragging.value = false
  const files = Array.from(event.dataTransfer?.files || [])
  agregarArchivos(files)
}

const handleFileSelect = (event: Event) => {
  const files = Array.from((event.target as HTMLInputElement).files || [])
  agregarArchivos(files)
}

const agregarArchivos = (files: File[]) => {
  const nuevosArchivos = files.map(file => ({
    file,
    uploading: false,
    uploaded: false,
    progress: 0
  }))
  archivos.value.push(...nuevosArchivos)
}

const eliminarArchivo = (index: number) => {
  archivos.value.splice(index, 1)
}

const limpiarArchivos = () => {
  archivos.value = []
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const subirArchivos = async () => {
  uploading.value = true

  for (const archivo of archivos.value) {
    if (archivo.uploaded) continue

    try {
      archivo.uploading = true
      archivo.error = undefined

      // Simular progreso de subida
      for (let i = 0; i <= 100; i += 10) {
        archivo.progress = i
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      // En producción, aquí iría la llamada a la API
      // const formData = new FormData()
      // formData.append('file', archivo.file)
      // formData.append('declaracionId', props.declaracionId)
      // await $fetch('/api/facturas/upload', { method: 'POST', body: formData })

      archivo.uploaded = true
      archivo.uploading = false
    } catch (error: any) {
      archivo.error = error.message || 'Error al subir archivo'
      archivo.uploading = false
    }
  }

  uploading.value = false
  emit('uploaded', archivos.value.filter(a => a.uploaded).map(a => a.file))
}

const abrirCamara = () => {
  modalCamara.value = true
}

const abrirBuzonSAT = () => {
  // Por implementar
  console.log('Abrir integración con buzón SAT')
}

const getFileIcon = (mimeType: string) => {
  if (mimeType.includes('xml')) return 'i-heroicons-document-text'
  if (mimeType.includes('pdf')) return 'i-heroicons-document'
  if (mimeType.includes('image')) return 'i-heroicons-photo'
  return 'i-heroicons-document'
}

const getFileColorClass = (mimeType: string) => {
  if (mimeType.includes('xml')) return 'text-blue-600'
  if (mimeType.includes('pdf')) return 'text-red-600'
  if (mimeType.includes('image')) return 'text-green-600'
  return 'text-gray-600'
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
</script>
