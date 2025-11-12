import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  from?: string
}

export async function sendEmail(options: EmailOptions) {
  try {
    const { data, error } = await resend.emails.send({
      from: options.from || 'Plataforma Fiscal <noreply@plataforma-fiscal.com>',
      to: options.to,
      subject: options.subject,
      html: options.html,
    })

    if (error) {
      console.error('Error sending email:', error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Failed to send email:', error)
    return { success: false, error }
  }
}

export async function sendDeclarationReminder(
  email: string,
  userName: string,
  declarationMonth: string,
  dueDate: string
) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Recordatorio de Declaración</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 10px 10px 0 0;
            text-align: center;
          }
          .content {
            background: #f7fafc;
            padding: 30px;
            border-radius: 0 0 10px 10px;
          }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background: #667eea;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            margin-top: 20px;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            color: #718096;
            font-size: 14px;
          }
          .warning {
            background: #fed7d7;
            border-left: 4px solid #fc8181;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🔔 Recordatorio de Declaración</h1>
        </div>
        <div class="content">
          <p>Hola <strong>${userName}</strong>,</p>

          <p>Te recordamos que tienes una declaración pendiente:</p>

          <div class="warning">
            <strong>📅 Mes:</strong> ${declarationMonth}<br>
            <strong>⏰ Fecha límite:</strong> ${dueDate}
          </div>

          <p>Por favor, asegúrate de completar todos los documentos requeridos antes de la fecha límite.</p>

          <a href="https://plataforma-fiscal.pages.dev/dashboard" class="button">
            Ver mis declaraciones →
          </a>

          <p style="margin-top: 30px;">
            Si ya completaste tu declaración, puedes ignorar este mensaje.
          </p>
        </div>
        <div class="footer">
          <p>Este es un mensaje automático, por favor no respondas a este correo.</p>
          <p>&copy; ${new Date().getFullYear()} Plataforma Fiscal Colaborativa</p>
        </div>
      </body>
    </html>
  `

  return sendEmail({
    to: email,
    subject: `Recordatorio: Declaración de ${declarationMonth}`,
    html,
  })
}

export async function sendWelcomeEmail(email: string, userName: string, userType: string) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bienvenido a Plataforma Fiscal</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            border-radius: 10px 10px 0 0;
            text-align: center;
          }
          .content {
            background: #ffffff;
            padding: 30px;
            border: 1px solid #e2e8f0;
            border-top: none;
          }
          .button {
            display: inline-block;
            padding: 14px 28px;
            background: #667eea;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            margin-top: 20px;
            font-weight: bold;
          }
          .features {
            background: #f7fafc;
            padding: 20px;
            border-radius: 6px;
            margin: 20px 0;
          }
          .feature-item {
            margin: 10px 0;
            padding-left: 25px;
            position: relative;
          }
          .feature-item:before {
            content: "✓";
            position: absolute;
            left: 0;
            color: #48bb78;
            font-weight: bold;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            color: #718096;
            font-size: 14px;
            padding: 20px;
            background: #f7fafc;
            border-radius: 0 0 10px 10px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎉 ¡Bienvenido a Plataforma Fiscal!</h1>
        </div>
        <div class="content">
          <p>Hola <strong>${userName}</strong>,</p>

          <p>Tu cuenta como <strong>${userType === 'contador' ? 'Contador' : 'Contribuyente'}</strong> ha sido creada exitosamente.</p>

          <div class="features">
            <h3>🚀 Comienza a usar la plataforma:</h3>
            <div class="feature-item">Gestiona tus declaraciones fiscales</div>
            <div class="feature-item">Colabora en tiempo real</div>
            <div class="feature-item">Recibe recordatorios automáticos</div>
            <div class="feature-item">Mantén todo organizado en un solo lugar</div>
          </div>

          <p style="text-align: center;">
            <a href="https://plataforma-fiscal.pages.dev/dashboard" class="button">
              Ir a mi dashboard →
            </a>
          </p>

          <p style="margin-top: 30px; color: #718096;">
            Si tienes alguna pregunta, no dudes en contactarnos.
          </p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Plataforma Fiscal Colaborativa</p>
          <p>Gestión colaborativa de declaraciones fiscales</p>
        </div>
      </body>
    </html>
  `

  return sendEmail({
    to: email,
    subject: '¡Bienvenido a Plataforma Fiscal!',
    html,
  })
}

export async function sendDeclarationStatusChange(
  email: string,
  userName: string,
  declarationMonth: string,
  newStatus: string
) {
  const statusMessages = {
    in_progress: '🔄 está siendo procesada',
    completed: '✅ ha sido completada',
    overdue: '⚠️ está vencida',
    pending: '⏳ está pendiente',
  }

  const message = statusMessages[newStatus as keyof typeof statusMessages] || 'ha cambiado de estado'

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Actualización de Declaración</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 10px 10px 0 0;
            text-align: center;
          }
          .content {
            background: #f7fafc;
            padding: 30px;
            border-radius: 0 0 10px 10px;
          }
          .status-box {
            background: white;
            border: 2px solid #667eea;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            text-align: center;
          }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background: #667eea;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📊 Actualización de Estado</h1>
        </div>
        <div class="content">
          <p>Hola <strong>${userName}</strong>,</p>

          <p>Tu declaración de <strong>${declarationMonth}</strong> ${message}.</p>

          <div class="status-box">
            <h2 style="margin: 0; color: #667eea;">Estado: ${newStatus.toUpperCase()}</h2>
          </div>

          <p style="text-align: center;">
            <a href="https://plataforma-fiscal.pages.dev/dashboard" class="button">
              Ver detalles →
            </a>
          </p>
        </div>
      </body>
    </html>
  `

  return sendEmail({
    to: email,
    subject: `Actualización: Declaración de ${declarationMonth}`,
    html,
  })
}
