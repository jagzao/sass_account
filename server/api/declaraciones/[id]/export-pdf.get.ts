import { useDB, schema } from '~/server/db'
import { eq } from 'drizzle-orm'
import { logAuditEvent } from '~/server/utils/audit'

/**
 * Export declaration as printable HTML (can be printed to PDF by browser)
 *
 * Note: PDFKit and other PDF libraries are not compatible with Cloudflare Workers.
 * This endpoint returns HTML optimized for printing, which the browser can convert to PDF.
 *
 * Alternative: Use a PDF generation service like:
 * - Cloudflare Workers PDF (upcoming)
 * - PDFShift API
 * - HTML2PDF API
 */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Declaration ID is required',
    })
  }

  try {
    const db = useDB()

    // Get declaration with related data
    const declaration = await db
      .select({
        id: schema.declaracionesMensuales.id,
        mes: schema.declaracionesMensuales.mes,
        anio: schema.declaracionesMensuales.anio,
        estado: schema.declaracionesMensuales.estado,
        montoTotal: schema.declaracionesMensuales.montoTotal,
        impuestoCalculado: schema.declaracionesMensuales.impuestoCalculado,
        observaciones: schema.declaracionesMensuales.observaciones,
        fechaLimite: schema.declaracionesMensuales.fechaLimite,
        fechaEnviada: schema.declaracionesMensuales.fechaEnviada,
        contribuyenteNombre: schema.usuarios.nombre,
        contribuyenteApellidos: schema.usuarios.apellidos,
        contribuyenteRFC: schema.usuarios.rfc,
        contribuyenteEmail: schema.usuarios.email,
      })
      .from(schema.declaracionesMensuales)
      .innerJoin(
        schema.usuarios,
        eq(schema.declaracionesMensuales.contribuyenteId, schema.usuarios.id)
      )
      .where(eq(schema.declaracionesMensuales.id, id))
      .get()

    if (!declaration) {
      throw createError({
        statusCode: 404,
        message: 'Declaration not found',
      })
    }

    // Verify access
    if (user.rol === 'contribuyente' && declaration.contribuyenteRFC !== user.rfc) {
      throw createError({
        statusCode: 403,
        message: 'Access denied',
      })
    }

    // Get facturas
    const facturas = await db
      .select()
      .from(schema.facturas)
      .where(eq(schema.facturas.declaracionId, id))
      .all()

    // Log export
    await logAuditEvent(event, {
      userId: user.id,
      action: 'declaration.exported',
      resource: `declaration:${id}`,
      resourceType: 'declaration',
      metadata: {
        format: 'html-pdf',
        mes: declaration.mes,
        anio: declaration.anio,
      },
    })

    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ]

    // Generate printable HTML
    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Declaración ${monthNames[declaration.mes - 1]} ${declaration.anio}</title>
  <style>
    @media print {
      @page {
        margin: 2cm;
        size: letter;
      }
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .no-print {
        display: none !important;
      }
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Arial', sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 21cm;
      margin: 0 auto;
      padding: 20px;
    }

    .header {
      border-bottom: 3px solid #667eea;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }

    .header h1 {
      color: #667eea;
      font-size: 28px;
      margin-bottom: 10px;
    }

    .header .subtitle {
      color: #666;
      font-size: 16px;
    }

    .section {
      margin-bottom: 30px;
    }

    .section-title {
      background: #f7fafc;
      padding: 10px;
      border-left: 4px solid #667eea;
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 15px;
    }

    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin-bottom: 20px;
    }

    .info-item {
      padding: 10px;
      background: #f9f9f9;
      border-radius: 5px;
    }

    .info-label {
      font-weight: bold;
      color: #667eea;
      font-size: 12px;
      text-transform: uppercase;
      margin-bottom: 5px;
    }

    .info-value {
      font-size: 16px;
      color: #333;
    }

    .status {
      display: inline-block;
      padding: 5px 15px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: bold;
    }

    .status-pendiente { background: #fed7d7; color: #c53030; }
    .status-revision { background: #feebc8; color: #c05621; }
    .status-generada { background: #c6f6d5; color: #2f855a; }
    .status-enviada { background: #bee3f8; color: #2c5282; }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
    }

    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #e2e8f0;
    }

    th {
      background: #667eea;
      color: white;
      font-weight: bold;
    }

    tr:hover {
      background: #f7fafc;
    }

    .totals {
      background: #f7fafc;
      padding: 20px;
      border-radius: 8px;
      margin-top: 20px;
    }

    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #e2e8f0;
    }

    .total-row.grand-total {
      font-size: 20px;
      font-weight: bold;
      color: #667eea;
      border-bottom: none;
      padding-top: 15px;
    }

    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 2px solid #e2e8f0;
      text-align: center;
      color: #666;
      font-size: 12px;
    }

    .print-button {
      position: fixed;
      top: 20px;
      right: 20px;
      background: #667eea;
      color: white;
      border: none;
      padding: 15px 30px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 16px;
      font-weight: bold;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      z-index: 1000;
    }

    .print-button:hover {
      background: #5568d3;
    }
  </style>
</head>
<body>
  <button class="print-button no-print" onclick="window.print()">🖨️ Imprimir / Guardar PDF</button>

  <div class="header">
    <h1>Declaración Fiscal Mensual</h1>
    <div class="subtitle">${monthNames[declaration.mes - 1]} ${declaration.anio}</div>
  </div>

  <div class="section">
    <div class="section-title">Información del Contribuyente</div>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Nombre Completo</div>
        <div class="info-value">${declaration.contribuyenteNombre} ${declaration.contribuyenteApellidos}</div>
      </div>
      <div class="info-item">
        <div class="info-label">RFC</div>
        <div class="info-value">${declaration.contribuyenteRFC || 'N/A'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Email</div>
        <div class="info-value">${declaration.contribuyenteEmail}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Estado</div>
        <div class="info-value">
          <span class="status status-${declaration.estado}">${declaration.estado.toUpperCase()}</span>
        </div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Fechas Importantes</div>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Fecha Límite</div>
        <div class="info-value">${declaration.fechaLimite ? new Date(declaration.fechaLimite).toLocaleDateString('es-MX') : 'N/A'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Fecha de Envío</div>
        <div class="info-value">${declaration.fechaEnviada ? new Date(declaration.fechaEnviada).toLocaleDateString('es-MX') : 'Pendiente'}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Documentos Fiscales (${facturas.length})</div>

    ${facturas.length > 0 ? `
    <table>
      <thead>
        <tr>
          <th>Folio</th>
          <th>Tipo</th>
          <th>RFC Emisor</th>
          <th>Monto</th>
          <th>IVA</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        ${facturas.map(f => `
          <tr>
            <td>${f.folio || 'N/A'}</td>
            <td>${f.tipoDocumento}</td>
            <td>${f.rfcEmisor || 'N/A'}</td>
            <td>$${(f.monto || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
            <td>$${(f.iva || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
            <td>$${((f.monto || 0) + (f.iva || 0)).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    ` : '<p style="padding: 20px; text-align: center; color: #999;">No hay documentos fiscales registrados</p>'}
  </div>

  <div class="section">
    <div class="section-title">Resumen Financiero</div>
    <div class="totals">
      <div class="total-row">
        <span>Monto Total Declarado:</span>
        <span>$${(declaration.montoTotal || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
      </div>
      <div class="total-row grand-total">
        <span>Impuesto Calculado:</span>
        <span>$${(declaration.impuestoCalculado || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
      </div>
    </div>
  </div>

  ${declaration.observaciones ? `
  <div class="section">
    <div class="section-title">Observaciones</div>
    <div style="padding: 15px; background: #f9f9f9; border-radius: 5px;">
      ${declaration.observaciones}
    </div>
  </div>
  ` : ''}

  <div class="footer">
    <p>Documento generado el ${new Date().toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}</p>
    <p>Plataforma Fiscal Colaborativa</p>
  </div>
</body>
</html>
    `

    // Return HTML with correct content type
    setResponseHeader(event, 'Content-Type', 'text/html; charset=utf-8')
    return html
  } catch (error: any) {
    await logAuditEvent(event, {
      userId: user.id,
      action: 'declaration.exported',
      resource: `declaration:${id}`,
      resourceType: 'declaration',
      status: 'failure',
      errorMessage: error.message,
    })

    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to export declaration',
    })
  }
})
