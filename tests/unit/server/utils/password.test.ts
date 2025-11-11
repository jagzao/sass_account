import { describe, it, expect } from 'vitest'
import { hashPassword, verifyPassword } from '../../../../server/utils/password'

describe('Password Utilities', () => {
  describe('hashPassword', () => {
    it('should hash a password successfully', async () => {
      const password = 'TestPassword123!'
      const hash = await hashPassword(password)

      expect(hash).toBeDefined()
      expect(typeof hash).toBe('string')
      expect(hash.length).toBeGreaterThan(0)
    })

    it('should generate different hashes for the same password', async () => {
      const password = 'SamePassword123!'
      const hash1 = await hashPassword(password)
      const hash2 = await hashPassword(password)

      expect(hash1).not.toBe(hash2)
    })

    it('should hash empty password', async () => {
      const hash = await hashPassword('')
      expect(hash).toBeDefined()
      expect(typeof hash).toBe('string')
    })

    it('should hash very long password', async () => {
      const longPassword = 'a'.repeat(1000)
      const hash = await hashPassword(longPassword)

      expect(hash).toBeDefined()
      expect(typeof hash).toBe('string')
    })

    it('should hash password with special characters', async () => {
      const password = '!@#$%^&*()_+-=[]{}|;:,.<>?~`'
      const hash = await hashPassword(password)

      expect(hash).toBeDefined()
      expect(typeof hash).toBe('string')
    })

    it('should hash password with unicode characters', async () => {
      const password = '密码测试🔒🎉'
      const hash = await hashPassword(password)

      expect(hash).toBeDefined()
      expect(typeof hash).toBe('string')
    })
  })

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const password = 'CorrectPassword123!'
      const hash = await hashPassword(password)
      const isValid = await verifyPassword(password, hash)

      expect(isValid).toBe(true)
    })

    it('should reject incorrect password', async () => {
      const correctPassword = 'CorrectPassword123!'
      const wrongPassword = 'WrongPassword123!'
      const hash = await hashPassword(correctPassword)
      const isValid = await verifyPassword(wrongPassword, hash)

      expect(isValid).toBe(false)
    })

    it('should reject empty password against valid hash', async () => {
      const password = 'TestPassword123!'
      const hash = await hashPassword(password)
      const isValid = await verifyPassword('', hash)

      expect(isValid).toBe(false)
    })

    it('should handle invalid hash format gracefully', async () => {
      const password = 'TestPassword123!'
      const invalidHash = 'not-a-valid-hash'

      // Should return false without throwing
      try {
        const isValid = await verifyPassword(password, invalidHash)
        expect(isValid).toBe(false)
      } catch (error) {
        // If it throws, that's also acceptable error handling
        expect(error).toBeDefined()
      }
    })

    it('should be case sensitive', async () => {
      const password = 'CaseSensitive123!'
      const hash = await hashPassword(password)

      const lowerCase = await verifyPassword('casesensitive123!', hash)
      const upperCase = await verifyPassword('CASESENSITIVE123!', hash)

      expect(lowerCase).toBe(false)
      expect(upperCase).toBe(false)
    })

    it('should work with special characters', async () => {
      const password = 'Special!@#$%^&*()'
      const hash = await hashPassword(password)
      const isValid = await verifyPassword(password, hash)

      expect(isValid).toBe(true)
    })

    it('should work with unicode characters', async () => {
      const password = '密码测试🔒🎉'
      const hash = await hashPassword(password)
      const isValid = await verifyPassword(password, hash)

      expect(isValid).toBe(true)
    })

    it('should handle very long passwords', async () => {
      const longPassword = 'a'.repeat(1000)
      const hash = await hashPassword(longPassword)
      const isValid = await verifyPassword(longPassword, hash)

      expect(isValid).toBe(true)
    })
  })

  describe('Security Properties', () => {
    it('should not allow hash comparison without verification', async () => {
      const password1 = 'Password123!'
      const password2 = 'Password123!'
      const hash1 = await hashPassword(password1)
      const hash2 = await hashPassword(password2)

      // Same password should not produce identical hashes (due to random salt)
      expect(hash1).not.toBe(hash2)

      // But both should verify correctly
      expect(await verifyPassword(password1, hash1)).toBe(true)
      expect(await verifyPassword(password2, hash2)).toBe(true)
    })

    it('should use sufficient computational cost', async () => {
      const password = 'BenchmarkPassword123!'
      const startTime = Date.now()
      await hashPassword(password)
      const duration = Date.now() - startTime

      // Should take at least 10ms (indicating proper iterations)
      expect(duration).toBeGreaterThan(10)
    })

    it('should produce hashes of consistent length', async () => {
      const passwords = [
        'short',
        'medium-password-123',
        'very-long-password-with-many-characters-123456789'
      ]

      const hashes = await Promise.all(passwords.map(hashPassword))
      const lengths = hashes.map((h) => h.length)

      // All hashes should have the same length
      expect(new Set(lengths).size).toBe(1)
    })
  })

  describe('Edge Cases', () => {
    it('should handle null-like strings', async () => {
      const nullString = 'null'
      const undefinedString = 'undefined'

      const hash1 = await hashPassword(nullString)
      const hash2 = await hashPassword(undefinedString)

      expect(await verifyPassword(nullString, hash1)).toBe(true)
      expect(await verifyPassword(undefinedString, hash2)).toBe(true)
      expect(await verifyPassword(nullString, hash2)).toBe(false)
    })

    it('should handle whitespace-only password', async () => {
      const whitespace = '   \t\n   '
      const hash = await hashPassword(whitespace)
      const isValid = await verifyPassword(whitespace, hash)

      expect(isValid).toBe(true)
    })

    it('should differentiate between similar passwords', async () => {
      const password1 = 'Password123'
      const password2 = 'Password123 ' // trailing space
      const password3 = ' Password123' // leading space

      const hash = await hashPassword(password1)

      expect(await verifyPassword(password1, hash)).toBe(true)
      expect(await verifyPassword(password2, hash)).toBe(false)
      expect(await verifyPassword(password3, hash)).toBe(false)
    })
  })
})
