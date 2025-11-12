/**
 * WebAuthn utilities for 2FA implementation
 * Uses @simplewebauthn/server for server-side WebAuthn operations
 */

import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  type VerifyRegistrationResponseOpts,
  type VerifyAuthenticationResponseOpts,
} from '@simplewebauthn/server'
import { useDB, schema } from '~/server/db'
import { eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'

const RP_NAME = 'Plataforma Fiscal'
const RP_ID = process.env.NODE_ENV === 'production'
  ? 'plataforma-fiscal.pages.dev'
  : 'localhost'
const ORIGIN = process.env.NODE_ENV === 'production'
  ? 'https://plataforma-fiscal.pages.dev'
  : 'http://localhost:3000'

/**
 * Generate options for WebAuthn registration (adding a new authenticator)
 */
export async function generateRegistrationOptionsForUser(userId: string, userName: string) {
  const db = useDB()

  // Get existing authenticators for this user
  const existingAuthenticators = await db
    .select()
    .from(schema.authenticators)
    .where(eq(schema.authenticators.userId, userId))
    .all()

  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: RP_ID,
    userID: userId,
    userName,
    // Don't prompt users for additional information about the authenticator
    attestationType: 'none',
    // Prevent users from re-registering existing authenticators
    excludeCredentials: existingAuthenticators.map(auth => ({
      id: Buffer.from(auth.credentialId, 'base64'),
      type: 'public-key',
      transports: auth.transports ? JSON.parse(auth.transports) : undefined,
    })),
    authenticatorSelection: {
      // Defaults
      residentKey: 'preferred',
      userVerification: 'preferred',
      // Optional: require authenticator to be attached to the device
      // authenticatorAttachment: 'platform',
    },
  })

  return options
}

/**
 * Verify WebAuthn registration response and store authenticator
 */
export async function verifyAndStoreRegistration(
  userId: string,
  response: any,
  expectedChallenge: string,
  deviceName?: string
) {
  const verification = await verifyRegistrationResponse({
    response,
    expectedChallenge,
    expectedOrigin: ORIGIN,
    expectedRPID: RP_ID,
  })

  if (!verification.verified || !verification.registrationInfo) {
    throw new Error('Verification failed')
  }

  const { credentialPublicKey, credentialID, counter } = verification.registrationInfo

  // Store the authenticator
  const db = useDB()
  await db.insert(schema.authenticators).values({
    id: nanoid(),
    userId,
    credentialId: Buffer.from(credentialID).toString('base64'),
    credentialPublicKey: Buffer.from(credentialPublicKey).toString('base64'),
    counter,
    transports: response.response.transports
      ? JSON.stringify(response.response.transports)
      : null,
    deviceName: deviceName || 'Security Key',
    createdAt: new Date(),
    lastUsedAt: null,
  })

  return verification
}

/**
 * Generate options for WebAuthn authentication
 */
export async function generateAuthenticationOptionsForUser(userId: string) {
  const db = useDB()

  // Get user's authenticators
  const authenticators = await db
    .select()
    .from(schema.authenticators)
    .where(eq(schema.authenticators.userId, userId))
    .all()

  if (authenticators.length === 0) {
    throw new Error('No authenticators registered')
  }

  const options = await generateAuthenticationOptions({
    rpID: RP_ID,
    // Require users to use a previously-registered authenticator
    allowCredentials: authenticators.map(auth => ({
      id: Buffer.from(auth.credentialId, 'base64'),
      type: 'public-key',
      transports: auth.transports ? JSON.parse(auth.transports) : undefined,
    })),
    userVerification: 'preferred',
  })

  return options
}

/**
 * Verify WebAuthn authentication response
 */
export async function verifyAuthenticationForUser(
  userId: string,
  response: any,
  expectedChallenge: string
) {
  const db = useDB()

  // Find the authenticator
  const credentialId = Buffer.from(response.id, 'base64url').toString('base64')
  const authenticator = await db
    .select()
    .from(schema.authenticators)
    .where(eq(schema.authenticators.credentialId, credentialId))
    .get()

  if (!authenticator || authenticator.userId !== userId) {
    throw new Error('Authenticator not found')
  }

  const verification = await verifyAuthenticationResponse({
    response,
    expectedChallenge,
    expectedOrigin: ORIGIN,
    expectedRPID: RP_ID,
    authenticator: {
      credentialID: Buffer.from(authenticator.credentialId, 'base64'),
      credentialPublicKey: Buffer.from(authenticator.credentialPublicKey, 'base64'),
      counter: authenticator.counter,
    },
  })

  if (!verification.verified) {
    throw new Error('Verification failed')
  }

  // Update counter and last used
  await db
    .update(schema.authenticators)
    .set({
      counter: verification.authenticationInfo.newCounter,
      lastUsedAt: new Date(),
    })
    .where(eq(schema.authenticators.id, authenticator.id))

  return verification
}

/**
 * Check if user has 2FA enabled
 */
export async function userHas2FA(userId: string): Promise<boolean> {
  const db = useDB()
  const authenticators = await db
    .select()
    .from(schema.authenticators)
    .where(eq(schema.authenticators.userId, userId))
    .all()

  return authenticators.length > 0
}

/**
 * Get user's authenticators
 */
export async function getUserAuthenticators(userId: string) {
  const db = useDB()
  return await db
    .select({
      id: schema.authenticators.id,
      deviceName: schema.authenticators.deviceName,
      createdAt: schema.authenticators.createdAt,
      lastUsedAt: schema.authenticators.lastUsedAt,
    })
    .from(schema.authenticators)
    .where(eq(schema.authenticators.userId, userId))
    .all()
}

/**
 * Remove an authenticator
 */
export async function removeAuthenticator(userId: string, authenticatorId: string) {
  const db = useDB()

  // Verify ownership
  const auth = await db
    .select()
    .from(schema.authenticators)
    .where(eq(schema.authenticators.id, authenticatorId))
    .get()

  if (!auth || auth.userId !== userId) {
    throw new Error('Authenticator not found')
  }

  await db
    .delete(schema.authenticators)
    .where(eq(schema.authenticators.id, authenticatorId))
}
