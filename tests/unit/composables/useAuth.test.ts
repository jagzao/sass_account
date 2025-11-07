import { describe, it, expect, beforeEach } from 'vitest'
import { useAuth } from '~/composables/useAuth'

describe('useAuth', () => {
  beforeEach(() => {
    // Reset state before each test
  })

  it('should initialize with null user', () => {
    const { user } = useAuth()
    expect(user.value).toBeNull()
  })

  it('should identify contador role', () => {
    const { isContador } = useAuth()
    expect(typeof isContador.value).toBe('boolean')
  })

  it('should identify contribuyente role', () => {
    const { isContribuyente } = useAuth()
    expect(typeof isContribuyente.value).toBe('boolean')
  })
})
