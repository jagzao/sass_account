/**
 * Email utilities using Cloudflare-compatible services
 *
 * Supported email services:
 * 1. MailChannels (FREE for Cloudflare Workers - RECOMMENDED)
 * 2. SendGrid API (free up to 100 emails/day)
 * 3. Postmark API (free up to 100 emails/month)
 *
 * Set EMAIL_SERVICE environment variable to choose:
 * - "mailchannels" (default)
 * - "sendgrid"
 * - "postmark"
 */

export interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  from?: string
  text?: string
}

/**
 * Send email using MailChannels
 * Documentation: https://mailchannels.zendesk.com/hc/en-us/articles/4565898358413-Sending-Email-from-Cloudflare-Workers-using-MailChannels-Send-API
 */
async function sendWithMailChannels(options: EmailOptions) {
  const config = useRuntimeConfig()
  const fromEmail = options.from || config.public.emailFrom || 'noreply@plataforma-fiscal.com'
  const fromName = config.public.emailFromName || 'Plataforma Fiscal'

  try {
    const response = await fetch('https://api.mailchannels.net/tx/v1/send', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: Array.isArray(options.to)
              ? options.to.map(email => ({ email }))
              : [{ email: options.to }],
          },
        ],
        from: {
          email: fromEmail,
          name: fromName,
        },
        subject: options.subject,
        content: [
          {
            type: 'text/html',
            value: options.html,
          },
          ...(options.text ? [{
            type: 'text/plain',
            value: options.text,
          }] : []),
        ],
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('❌ MailChannels error:', error)
      return {
        success: false,
        error: new Error(`MailChannels error: ${response.status} - ${error}`)
      }
    }

    return {
      success: true,
      data: { id: `mailchannels-${Date.now()}`, provider: 'mailchannels' }
    }
  } catch (error) {
    console.error('❌ Failed to send email with MailChannels:', error)
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Unknown error')
    }
  }
}

/**
 * Send email using SendGrid
 */
async function sendWithSendGrid(options: EmailOptions) {
  const config = useRuntimeConfig()
  const apiKey = config.sendgridApiKey

  if (!apiKey) {
    console.error('❌ SendGrid API key not configured')
    return {
      success: false,
      error: new Error('SendGrid API key not configured')
    }
  }

  const fromEmail = options.from || config.public.emailFrom || 'noreply@plataforma-fiscal.com'

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{
          to: Array.isArray(options.to)
            ? options.to.map(email => ({ email }))
            : [{ email: options.to }]
        }],
        from: { email: fromEmail },
        subject: options.subject,
        content: [{
          type: 'text/html',
          value: options.html
        }]
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('❌ SendGrid error:', error)
      return {
        success: false,
        error: new Error(`SendGrid error: ${response.status}`)
      }
    }

    return {
      success: true,
      data: { id: `sendgrid-${Date.now()}`, provider: 'sendgrid' }
    }
  } catch (error) {
    console.error('❌ Failed to send email with SendGrid:', error)
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Unknown error')
    }
  }
}

/**
 * Send email using Postmark
 */
async function sendWithPostmark(options: EmailOptions) {
  const config = useRuntimeConfig()
  const apiKey = config.postmarkApiKey

  if (!apiKey) {
    console.error('❌ Postmark API key not configured')
    return {
      success: false,
      error: new Error('Postmark API key not configured')
    }
  }

  const fromEmail = options.from || config.public.emailFrom || 'noreply@plataforma-fiscal.com'

  try {
    const response = await fetch('https://api.postmarkapp.com/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Postmark-Server-Token': apiKey,
      },
      body: JSON.stringify({
        From: fromEmail,
        To: Array.isArray(options.to) ? options.to.join(',') : options.to,
        Subject: options.subject,
        HtmlBody: options.html,
        TextBody: options.text,
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('❌ Postmark error:', error)
      return {
        success: false,
        error: new Error(`Postmark error: ${response.status}`)
      }
    }

    const data = await response.json()
    return {
      success: true,
      data: { id: data.MessageID, provider: 'postmark' }
    }
  } catch (error) {
    console.error('❌ Failed to send email with Postmark:', error)
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Unknown error')
    }
  }
}

/**
 * Send email using the configured email service
 */
export async function sendEmail(options: EmailOptions) {
  const config = useRuntimeConfig()
  const emailService = config.emailService || 'mailchannels'

  // Log email in development
  if (process.env.NODE_ENV === 'development') {
    console.log('📧 Email que se enviaría:', {
      service: emailService,
      to: options.to,
      from: options.from || config.public.emailFrom || 'noreply@plataforma-fiscal.com',
      subject: options.subject,
      htmlLength: options.html.length,
    })
  }

  // Send email based on configured service
  switch (emailService) {
    case 'sendgrid':
      return sendWithSendGrid(options)
    case 'postmark':
      return sendWithPostmark(options)
    case 'mailchannels':
    default:
      return sendWithMailChannels(options)
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
