/**
 * Password hashing utilities compatible with Cloudflare Workers
 * Uses Web Crypto API (edge-compatible)
 */

const SALT_LENGTH = 16
const KEY_LENGTH = 32
const ITERATIONS = 100000

/**
 * Hash a password using PBKDF2 (edge-compatible)
 */
export async function hashPassword(password: string): Promise<string> {
  // Generate random salt
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH))

  // Convert password to buffer
  const passwordBuffer = new TextEncoder().encode(password)

  // Import key
  const key = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveBits']
  )

  // Derive key using PBKDF2
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: ITERATIONS,
      hash: 'SHA-256'
    },
    key,
    KEY_LENGTH * 8
  )

  const hashArray = new Uint8Array(derivedBits)

  // Combine salt and hash
  const combined = new Uint8Array(salt.length + hashArray.length)
  combined.set(salt)
  combined.set(hashArray, salt.length)

  // Return base64 encoded
  return btoa(String.fromCharCode(...combined))
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  try {
    // Decode the stored hash
    const combined = Uint8Array.from(atob(hashedPassword), c => c.charCodeAt(0))

    // Extract salt and hash
    const salt = combined.slice(0, SALT_LENGTH)
    const storedHash = combined.slice(SALT_LENGTH)

    // Convert password to buffer
    const passwordBuffer = new TextEncoder().encode(password)

    // Import key
    const key = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      'PBKDF2',
      false,
      ['deriveBits']
    )

    // Derive key using same parameters
    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt,
        iterations: ITERATIONS,
        hash: 'SHA-256'
      },
      key,
      KEY_LENGTH * 8
    )

    const computedHash = new Uint8Array(derivedBits)

    // Compare hashes in constant time
    if (computedHash.length !== storedHash.length) {
      return false
    }

    let result = 0
    for (let i = 0; i < computedHash.length; i++) {
      result |= computedHash[i] ^ storedHash[i]
    }

    return result === 0
  } catch (error) {
    console.error('Error verifying password:', error)
    return false
  }
}
