export default defineNuxtRouteMiddleware(async (to, from) => {
  const { user, fetchUser } = useAuth()

  // Si no hay usuario cargado, intentar obtenerlo
  if (!user.value) {
    await fetchUser()
  }

  // Si ya hay usuario autenticado, redirigir al dashboard
  if (user.value) {
    return navigateTo('/dashboard')
  }
})
