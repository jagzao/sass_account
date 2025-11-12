import { logAuditEvent } from '~/server/utils/audit'
import { useDB, schema } from '~/server/db'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  try {
    // Get user's audit logs
    const db = useDB()
    const logs = await db
      .select({
        id: schema.auditLogs.id,
        action: schema.auditLogs.action,
        resource: schema.auditLogs.resource,
        resourceType: schema.auditLogs.resourceType,
        metadata: schema.auditLogs.metadata,
        ipAddress: schema.auditLogs.ipAddress,
        status: schema.auditLogs.status,
        createdAt: schema.auditLogs.createdAt,
      })
      .from(schema.auditLogs)
      .where(eq(schema.auditLogs.userId, user.id))
      .orderBy(schema.auditLogs.createdAt)
      .limit(100)
      .all()

    // Parse metadata
    const parsedLogs = logs.map(log => ({
      ...log,
      metadata: log.metadata ? JSON.parse(log.metadata) : null,
    }))

    // Log this access
    await logAuditEvent(event, {
      userId: user.id,
      action: 'audit_logs.viewed',
      resource: `user:${user.id}`,
      resourceType: 'audit_logs',
    })

    return parsedLogs
  } catch (error: any) {
    await logAuditEvent(event, {
      userId: user.id,
      action: 'audit_logs.viewed',
      resource: `user:${user.id}`,
      resourceType: 'audit_logs',
      status: 'failure',
      errorMessage: error.message,
    })

    throw createError({
      statusCode: 500,
      message: 'Failed to fetch audit logs',
    })
  }
})
