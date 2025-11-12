import { useDB, schema } from '~/server/db'
import type { H3Event } from 'h3'
import { nanoid } from 'nanoid'

export interface AuditEventOptions {
  userId: string
  action: string
  resource: string
  resourceType: string
  metadata?: Record<string, any>
  status?: 'success' | 'failure'
  errorMessage?: string
}

/**
 * Log an audit event for legal traceability
 *
 * @example
 * await logAuditEvent(event, {
 *   userId: user.id,
 *   action: 'declaration.updated',
 *   resource: `declaration:${id}`,
 *   resourceType: 'declaration',
 *   metadata: { changes: data }
 * })
 */
export async function logAuditEvent(
  event: H3Event,
  options: AuditEventOptions
): Promise<void> {
  try {
    const db = useDB()

    // Get client info
    const ipAddress = getRequestIP(event)
    const userAgent = getHeader(event, 'user-agent') || ''

    await db.insert(schema.auditLogs).values({
      id: nanoid(),
      userId: options.userId,
      action: options.action,
      resource: options.resource,
      resourceType: options.resourceType,
      metadata: options.metadata ? JSON.stringify(options.metadata) : null,
      ipAddress,
      userAgent,
      status: options.status || 'success',
      errorMessage: options.errorMessage || null,
      createdAt: new Date(),
    })

    // Also send critical events to Sentry
    if (shouldAlertSentry(options.action, options.status)) {
      const Sentry = await import('@sentry/nuxt').catch(() => null)
      if (Sentry) {
        Sentry.captureMessage(`Audit: ${options.action}`, {
          level: options.status === 'failure' ? 'error' : 'info',
          extra: {
            userId: options.userId,
            resource: options.resource,
            resourceType: options.resourceType,
            ipAddress,
            ...options.metadata,
          },
        })
      }
    }
  } catch (error) {
    // Don't let audit logging break the actual operation
    console.error('Failed to log audit event:', error)
  }
}

/**
 * Get client IP address from various headers
 */
function getRequestIP(event: H3Event): string | undefined {
  const headers = event.node.req.headers

  // Cloudflare
  const cfConnectingIp = headers['cf-connecting-ip']
  if (cfConnectingIp) {
    return Array.isArray(cfConnectingIp) ? cfConnectingIp[0] : cfConnectingIp
  }

  // Standard headers
  const xRealIp = headers['x-real-ip']
  if (xRealIp) {
    return Array.isArray(xRealIp) ? xRealIp[0] : xRealIp
  }

  const xForwardedFor = headers['x-forwarded-for']
  if (xForwardedFor) {
    const ips = Array.isArray(xForwardedFor) ? xForwardedFor[0] : xForwardedFor
    return ips.split(',')[0].trim()
  }

  return event.node.req.socket.remoteAddress
}

/**
 * Determine if event should alert Sentry
 */
function shouldAlertSentry(action: string, status?: string): boolean {
  // Alert on all failures
  if (status === 'failure') {
    return true
  }

  // Alert on critical actions
  const criticalActions = [
    'user.delete',
    'declaration.delete',
    'factura.delete',
    'permission.change',
    'data.export',
    'audit.delete', // Someone trying to delete audit logs!
  ]

  return criticalActions.some(critical => action.includes(critical))
}

/**
 * Query audit logs for a specific user
 */
export async function getAuditLogsForUser(
  userId: string,
  options?: {
    limit?: number
    offset?: number
    resourceType?: string
    action?: string
  }
) {
  const db = useDB()
  const { limit = 50, offset = 0, resourceType, action } = options || {}

  let query = db
    .select()
    .from(schema.auditLogs)
    .where(eq(schema.auditLogs.userId, userId))
    .orderBy(desc(schema.auditLogs.createdAt))
    .limit(limit)
    .offset(offset)

  if (resourceType) {
    query = query.where(eq(schema.auditLogs.resourceType, resourceType))
  }

  if (action) {
    query = query.where(eq(schema.auditLogs.action, action))
  }

  return await query.all()
}

/**
 * Query audit logs for a specific resource
 */
export async function getAuditLogsForResource(
  resource: string,
  limit: number = 50
) {
  const db = useDB()

  return await db
    .select()
    .from(schema.auditLogs)
    .where(eq(schema.auditLogs.resource, resource))
    .orderBy(desc(schema.auditLogs.createdAt))
    .limit(limit)
    .all()
}

// Import necessary functions
import { eq, desc } from 'drizzle-orm'
