import type { User } from '~/types'

export const useAuth = () => {
  const user = useState<User | null>('user', () => null)
  const loading = useState('authLoading', () => false)

  const fetchUser = async () => {
    try {
      loading.value = true
      const { user: fetchedUser } = await $fetch('/api/auth/me')
      user.value = fetchedUser as User
    } catch (error) {
      user.value = null
    } finally {
      loading.value = false
    }
  }

  const login = async (email: string, password: string) => {
    try {
      const response = await $fetch('/api/auth/login', {
        method: 'POST',
        body: { email, password }
      })
      user.value = response.user as User
      return response
    } catch (error: any) {
      throw new Error(error?.data?.statusMessage || 'Error al iniciar sesión')
    }
  }

  const register = async (data: {
    email: string
    password: string
    nombre: string
    apellidos: string
    rol: 'contribuyente' | 'contador'
    telefono?: string
    rfc?: string
    despacho?: string
    regimenFiscal?: string
  }) => {
    try {
      const response = await $fetch('/api/auth/register', {
        method: 'POST',
        body: data
      })
      user.value = response.user as User
      return response
    } catch (error: any) {
      throw new Error(error?.data?.statusMessage || 'Error al registrarse')
    }
  }

  const logout = async () => {
    try {
      await $fetch('/api/auth/logout', {
        method: 'POST'
      })
      user.value = null
      await navigateTo('/login')
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    }
  }

  const isContador = computed(() => user.value?.rol === 'contador')
  const isContribuyente = computed(() => user.value?.rol === 'contribuyente')

  return {
    user: readonly(user),
    loading: readonly(loading),
    isContador,
    isContribuyente,
    fetchUser,
    login,
    register,
    logout
  }
}
