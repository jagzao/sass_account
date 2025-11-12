import { atom } from 'jotai'

// UI state atoms
export const sidebarOpenAtom = atom(false)
export const themeAtom = atom<'light' | 'dark'>('light')
export const isLoadingAtom = atom(false)

// Toast notification atom
export interface Toast {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  message: string
  duration?: number
}

export const toastsAtom = atom<Toast[]>([])

// Add toast action atom
export const addToastAtom = atom(
  null,
  (get, set, toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(7)
    const newToast = { ...toast, id }
    set(toastsAtom, [...get(toastsAtom), newToast])

    // Auto-remove after duration
    const duration = toast.duration || 3000
    setTimeout(() => {
      set(removeToastAtom, id)
    }, duration)
  }
)

// Remove toast action atom
export const removeToastAtom = atom(
  null,
  (get, set, id: string) => {
    set(toastsAtom, get(toastsAtom).filter((t) => t.id !== id))
  }
)

// Loading state actions
export const setLoadingAtom = atom(
  null,
  (get, set, loading: boolean) => {
    set(isLoadingAtom, loading)
  }
)
