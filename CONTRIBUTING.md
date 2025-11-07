# Guía de Contribución

¡Gracias por tu interés en contribuir a la Plataforma de Declaraciones Fiscales Colaborativas!

## 🚀 Cómo Contribuir

### Reportar Bugs

1. Verifica que el bug no haya sido reportado antes
2. Abre un nuevo issue con:
   - Título descriptivo
   - Pasos para reproducir
   - Comportamiento esperado vs actual
   - Screenshots si aplica
   - Versión del navegador y sistema operativo

### Sugerir Features

1. Abre un issue con el tag "enhancement"
2. Describe el problema que resuelve
3. Propón una solución
4. Incluye mockups si es posible

### Pull Requests

1. Fork el repositorio
2. Crea una rama desde `main`:
   ```bash
   git checkout -b feature/mi-nueva-feature
   ```
3. Haz tus cambios siguiendo las guías de estilo
4. Asegúrate de que los tests pasen:
   ```bash
   npm run test
   npm run lint
   ```
5. Commit con mensajes descriptivos:
   ```bash
   git commit -m "feat: agregar filtro de búsqueda en dashboard"
   ```
6. Push a tu fork:
   ```bash
   git push origin feature/mi-nueva-feature
   ```
7. Abre un Pull Request

## 📝 Guías de Estilo

### Código

- Usa TypeScript para todo el código
- Sigue las reglas de ESLint configuradas
- Formatea con Prettier antes de commitear
- Escribe tests para nuevas features
- Comenta código complejo

### Commits

Usa [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` Nueva funcionalidad
- `fix:` Corrección de bug
- `docs:` Cambios en documentación
- `style:` Cambios de formato (sin afectar código)
- `refactor:` Refactorización de código
- `test:` Agregar o modificar tests
- `chore:` Cambios en build o herramientas

### Vue Components

```vue
<template>
  <!-- Use semantic HTML -->
  <div class="component-name">
    <!-- Content -->
  </div>
</template>

<script setup lang="ts">
// Imports
import { ref } from 'vue'

// Props
const props = defineProps<{
  title: string
}>()

// State
const count = ref(0)

// Methods
const increment = () => {
  count.value++
}
</script>

<style scoped>
/* Minimal component-specific styles */
/* Use Tailwind classes when possible */
</style>
```

## 🧪 Testing

- Escribe tests unitarios para lógica de negocio
- Escribe tests E2E para flujos críticos
- Mantén coverage > 80%

## 📚 Documentación

- Documenta nuevas features en el README
- Actualiza el JSDoc de funciones públicas
- Incluye ejemplos de uso

## ❓ Preguntas

Si tienes dudas, abre un issue con la etiqueta "question" o contacta al equipo.

¡Gracias por contribuir! 🎉
