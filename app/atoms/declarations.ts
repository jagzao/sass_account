import { atom } from 'jotai'
import type { Declaration } from '~/types/declarations'

// Declarations state atoms
export const declarationsAtom = atom<Declaration[]>([])
export const selectedDeclarationAtom = atom<Declaration | null>(null)
export const isLoadingDeclarationsAtom = atom(false)

// Filter atoms
export const declarationsFilterAtom = atom({
  status: 'all' as 'all' | 'pending' | 'in_progress' | 'completed' | 'overdue',
  month: null as number | null,
  year: new Date().getFullYear(),
})

// Derived atoms
export const filteredDeclarationsAtom = atom((get) => {
  const declarations = get(declarationsAtom)
  const filter = get(declarationsFilterAtom)

  return declarations.filter((declaration) => {
    // Status filter
    if (filter.status !== 'all' && declaration.status !== filter.status) {
      return false
    }

    // Month filter
    if (filter.month !== null && declaration.month !== filter.month) {
      return false
    }

    // Year filter
    if (declaration.year !== filter.year) {
      return false
    }

    return true
  })
})

export const pendingDeclarationsCountAtom = atom((get) => {
  const declarations = get(declarationsAtom)
  return declarations.filter((d) => d.status === 'pending').length
})

export const overdueDeclarationsCountAtom = atom((get) => {
  const declarations = get(declarationsAtom)
  return declarations.filter((d) => d.status === 'overdue').length
})

// Action atoms
export const updateDeclarationAtom = atom(
  null,
  (get, set, updatedDeclaration: Declaration) => {
    const declarations = get(declarationsAtom)
    const index = declarations.findIndex((d) => d.id === updatedDeclaration.id)

    if (index !== -1) {
      const newDeclarations = [...declarations]
      newDeclarations[index] = updatedDeclaration
      set(declarationsAtom, newDeclarations)
    }
  }
)

export const addDeclarationAtom = atom(
  null,
  (get, set, declaration: Declaration) => {
    const declarations = get(declarationsAtom)
    set(declarationsAtom, [...declarations, declaration])
  }
)
