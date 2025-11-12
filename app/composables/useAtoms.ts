import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { userAtom, isAuthenticatedAtom, isLoadingAuthAtom, isContadorAtom, isContribuyenteAtom, userDisplayNameAtom } from '~/atoms/auth'
import { sidebarOpenAtom, themeAtom, isLoadingAtom, toastsAtom, addToastAtom, removeToastAtom, setLoadingAtom } from '~/atoms/ui'
import {
  declarationsAtom,
  selectedDeclarationAtom,
  isLoadingDeclarationsAtom,
  declarationsFilterAtom,
  filteredDeclarationsAtom,
  pendingDeclarationsCountAtom,
  overdueDeclarationsCountAtom,
  updateDeclarationAtom,
  addDeclarationAtom
} from '~/atoms/declarations'

// Auth composables
export const useUser = () => {
  const [user, setUser] = useAtom(userAtom)
  const isAuthenticated = useAtomValue(isAuthenticatedAtom)
  const isLoading = useAtomValue(isLoadingAuthAtom)
  const isContador = useAtomValue(isContadorAtom)
  const isContribuyente = useAtomValue(isContribuyenteAtom)
  const displayName = useAtomValue(userDisplayNameAtom)

  return {
    user,
    setUser,
    isAuthenticated,
    isLoading,
    isContador,
    isContribuyente,
    displayName,
  }
}

// UI composables
export const useSidebar = () => {
  const [isOpen, setIsOpen] = useAtom(sidebarOpenAtom)

  const toggle = () => setIsOpen(!isOpen)
  const open = () => setIsOpen(true)
  const close = () => setIsOpen(false)

  return {
    isOpen,
    toggle,
    open,
    close,
  }
}

export const useTheme = () => {
  const [theme, setTheme] = useAtom(themeAtom)

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  return {
    theme,
    setTheme,
    toggleTheme,
  }
}

export const useLoading = () => {
  const isLoading = useAtomValue(isLoadingAtom)
  const setLoading = useSetAtom(setLoadingAtom)

  return {
    isLoading,
    setLoading,
  }
}

export const useToast = () => {
  const toasts = useAtomValue(toastsAtom)
  const addToast = useSetAtom(addToastAtom)
  const removeToast = useSetAtom(removeToastAtom)

  const success = (message: string, duration?: number) => {
    addToast({ type: 'success', message, duration })
  }

  const error = (message: string, duration?: number) => {
    addToast({ type: 'error', message, duration })
  }

  const info = (message: string, duration?: number) => {
    addToast({ type: 'info', message, duration })
  }

  const warning = (message: string, duration?: number) => {
    addToast({ type: 'warning', message, duration })
  }

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    info,
    warning,
  }
}

// Declarations composables
export const useDeclarations = () => {
  const [declarations, setDeclarations] = useAtom(declarationsAtom)
  const [selectedDeclaration, setSelectedDeclaration] = useAtom(selectedDeclarationAtom)
  const isLoading = useAtomValue(isLoadingDeclarationsAtom)
  const filtered = useAtomValue(filteredDeclarationsAtom)
  const [filter, setFilter] = useAtom(declarationsFilterAtom)
  const pendingCount = useAtomValue(pendingDeclarationsCountAtom)
  const overdueCount = useAtomValue(overdueDeclarationsCountAtom)
  const updateDeclaration = useSetAtom(updateDeclarationAtom)
  const addDeclaration = useSetAtom(addDeclarationAtom)

  return {
    declarations,
    setDeclarations,
    selectedDeclaration,
    setSelectedDeclaration,
    isLoading,
    filtered,
    filter,
    setFilter,
    pendingCount,
    overdueCount,
    updateDeclaration,
    addDeclaration,
  }
}
