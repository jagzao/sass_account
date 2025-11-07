export default defineNuxtRouteMiddleware(async (to, from) => {
  const { user, fetchUser } = useAuth()

  // Si no hay usuario cargado, intentar obtenerlo
  if (!user.value) {
    await fetchUser()
  }

  // Si aún no hay usuario, redirigir a login
  if (!user.value) {
    return navigateTo('/login')
  }
})
