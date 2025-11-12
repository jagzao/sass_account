import { sendDeclarationReminder } from '~/server/utils/email'

export default defineEventHandler(async (event) => {
  try {
    // Verify cron secret to prevent unauthorized access
    const cronSecret = event.headers.get('x-cron-secret')
    if (cronSecret !== process.env.CRON_SECRET) {
      throw createError({
        statusCode: 401,
        message: 'Unauthorized',
      })
    }

    // Get all declarations that are pending and due within 3 days
    const db = useDatabase()
    const threeDaysFromNow = new Date()
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)

    const declarations = await db
      .select({
        id: tables.declarations.id,
        month: tables.declarations.month,
        year: tables.declarations.year,
        dueDate: tables.declarations.dueDate,
        userId: tables.declarations.userId,
        userName: tables.users.nombre,
        userLastName: tables.users.apellidos,
        userEmail: tables.users.email,
      })
      .from(tables.declarations)
      .innerJoin(tables.users, eq(tables.users.id, tables.declarations.userId))
      .where(
        and(
          eq(tables.declarations.status, 'pending'),
          lte(tables.declarations.dueDate, threeDaysFromNow.toISOString())
        )
      )
      .execute()

    const monthNames = [
      'Enero',
      'Febrero',
      'Marzo',
      'Abril',
      'Mayo',
      'Junio',
      'Julio',
      'Agosto',
      'Septiembre',
      'Octubre',
      'Noviembre',
      'Diciembre',
    ]

    const results = []

    for (const declaration of declarations) {
      const monthName = monthNames[declaration.month - 1]
      const fullName = `${declaration.userName} ${declaration.userLastName}`
      const dueDate = new Date(declaration.dueDate).toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })

      const result = await sendDeclarationReminder(
        declaration.userEmail,
        fullName,
        `${monthName} ${declaration.year}`,
        dueDate
      )

      results.push({
        declarationId: declaration.id,
        email: declaration.userEmail,
        success: result.success,
      })
    }

    return {
      success: true,
      remindersSent: results.filter((r) => r.success).length,
      totalDeclarations: declarations.length,
      results,
    }
  } catch (error: any) {
    console.error('Error sending reminders:', error)
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to send reminders',
    })
  }
})
