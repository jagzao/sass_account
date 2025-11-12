import { atom } from 'jotai'
import type { User } from '~/types/auth'

// Auth state atoms
export const userAtom = atom<User | null>(null)
export const isAuthenticatedAtom = atom((get) => get(userAtom) !== null)
export const isLoadingAuthAtom = atom(false)

// Derived atoms
export const isContadorAtom = atom((get) => {
  const user = get(userAtom)
  return user?.userType === 'contador'
})

export const isContribuyenteAtom = atom((get) => {
  const user = get(userAtom)
  return user?.userType === 'contribuyente'
})

export const userDisplayNameAtom = atom((get) => {
  const user = get(userAtom)
  return user ? `${user.nombre} ${user.apellidos}` : ''
})
