/**
 * Script de Seed para Base de Datos Local
 *
 * Crea datos de prueba para desarrollo y testing:
 * - 2 usuarios (1 contador, 1 contribuyente)
 * - Declaraciones mensuales de ejemplo
 * - Facturas de prueba
 * - Checklist items
 * - Comentarios
 *
 * Uso: npx tsx server/db/seed.ts
 */

import { drizzle } from 'drizzle-orm/better-sqlite3'
import Database from 'better-sqlite3'
import * as schema from './schema'
import { nanoid } from 'nanoid'
import { hashPassword } from '../utils/password'

const sqlite = new Database('local.db')
const db = drizzle(sqlite, { schema })

async function seed() {
  console.log('🌱 Iniciando seed de base de datos...\n')

  try {
    // Limpiar tablas existentes
    console.log('🗑️  Limpiando tablas existentes...')
    await db.delete(schema.comentarios)
    await db.delete(schema.checklistItems)
    await db.delete(schema.facturas)
    await db.delete(schema.declaracionesMensuales)
    await db.delete(schema.notificaciones)
    await db.delete(schema.sessions)
    await db.delete(schema.usuarios)

    // 1. Crear usuarios
    console.log('\n👥 Creando usuarios de prueba...')

    const hashedPassword1 = await hashPassword('TestPassword123!')
    const hashedPassword2 = await hashPassword('TestPassword456!')

    const contribuyenteId = nanoid()
    const contadorId = nanoid()

    await db.insert(schema.usuarios).values([
      {
        id: contribuyenteId,
        email: 'maria.gonzalez@test.com',
        hashedPassword: hashedPassword1,
        nombre: 'María',
        apellidos: 'González García',
        telefono: '5512345678',
        rfc: 'GOGM900101ABC',
        rol: 'contribuyente',
        regimenFiscal: '612',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: contadorId,
        email: 'juan.perez@test.com',
        hashedPassword: hashedPassword2,
        nombre: 'Juan',
        apellidos: 'Pérez López',
        telefono: '5587654321',
        rfc: 'PELJ850515XYZ',
        rol: 'contador',
        despacho: 'Contadores Asociados SC',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ])

    console.log('  ✅ Contribuyente: maria.gonzalez@test.com / TestPassword123!')
    console.log('  ✅ Contador: juan.perez@test.com / TestPassword456!')

    // 2. Crear declaraciones mensuales (últimos 6 meses)
    console.log('\n📋 Creando declaraciones mensuales...')

    const meses = [
      { mes: 11, anio: 2024, estado: 'enviada', color: 'verde' },
      { mes: 10, anio: 2024, estado: 'generada', color: 'amarillo' },
      { mes: 9, anio: 2024, estado: 'revision', color: 'amarillo' },
      { mes: 8, anio: 2024, estado: 'pendiente', color: 'rojo' },
      { mes: 7, anio: 2024, estado: 'enviada', color: 'verde' },
      { mes: 6, anio: 2024, estado: 'enviada', color: 'verde' }
    ]

    const declaracionIds: string[] = []

    for (const { mes, anio, estado, color } of meses) {
      const id = nanoid()
      declaracionIds.push(id)

      await db.insert(schema.declaracionesMensuales).values({
        id,
        contribuyenteId,
        contadorId,
        mes,
        anio,
        estado: estado as any,
        colorEstado: color as any,
        fechaLimite: new Date(anio, mes, 17), // Día 17 del mes siguiente
        createdAt: new Date(),
        updatedAt: new Date()
      })
    }

    console.log(`  ✅ ${meses.length} declaraciones creadas`)

    // 3. Crear facturas para algunas declaraciones
    console.log('\n📄 Creando facturas de ejemplo...')

    const facturas = [
      { nombre: 'Factura_Ejemplo_001.xml', tipo: 'xml', tamaño: 15420 },
      { nombre: 'Factura_Ejemplo_002.pdf', tipo: 'pdf', tamaño: 248900 },
      { nombre: 'Factura_Ejemplo_003.xml', tipo: 'xml', tamaño: 12800 },
      { nombre: 'Ticket_Gasolina.jpg', tipo: 'imagen', tamaño: 523400 }
    ]

    let facturaCount = 0
    for (let i = 0; i < 3; i++) {
      for (const factura of facturas) {
        await db.insert(schema.facturas).values({
          id: nanoid(),
          declaracionId: declaracionIds[i],
          nombreArchivo: factura.nombre,
          tipoArchivo: factura.tipo as any,
          tamanoArchivo: factura.tamaño,
          urlArchivo: `/storage/${factura.nombre}`,
          uploadedBy: contribuyenteId,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        facturaCount++
      }
    }

    console.log(`  ✅ ${facturaCount} facturas creadas`)

    // 4. Crear checklist items
    console.log('\n✅ Creando checklist items...')

    const checklistTemplates = [
      'Facturas de ingresos subidas',
      'Facturas de gastos subidas',
      'Comprobantes de nómina',
      'Estados de cuenta bancarios',
      'Declaración preliminar revisada',
      'Firma electrónica activa',
      'Contraseña SAT actualizada'
    ]

    let checklistCount = 0
    for (let i = 0; i < 3; i++) {
      for (const [index, titulo] of checklistTemplates.entries()) {
        await db.insert(schema.checklistItems).values({
          id: nanoid(),
          declaracionId: declaracionIds[i],
          titulo,
          completado: index < 3, // Primeros 3 completados
          orden: index,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        checklistCount++
      }
    }

    console.log(`  ✅ ${checklistCount} items de checklist creados`)

    // 5. Crear comentarios
    console.log('\n💬 Creando comentarios de ejemplo...')

    const comentarios = [
      { texto: '¿Ya tienes todas las facturas de este mes?', autor: contadorId },
      { texto: 'Sí, ya las subí todas. ¿Puedes revisar?', autor: contribuyenteId },
      { texto: 'Perfecto, voy a revisar y genero la declaración preliminar.', autor: contadorId },
      { texto: 'Falta el estado de cuenta del banco, ¿lo puedes subir?', autor: contadorId },
      { texto: 'Claro, lo subo en la tarde.', autor: contribuyenteId }
    ]

    for (const comentario of comentarios) {
      await db.insert(schema.comentarios).values({
        id: nanoid(),
        declaracionId: declaracionIds[0], // Todos en la declaración más reciente
        autorId: comentario.autor,
        texto: comentario.texto,
        createdAt: new Date(),
        updatedAt: new Date()
      })
    }

    console.log(`  ✅ ${comentarios.length} comentarios creados`)

    // 6. Crear notificaciones
    console.log('\n🔔 Creando notificaciones...')

    await db.insert(schema.notificaciones).values([
      {
        id: nanoid(),
        usuarioId: contribuyenteId,
        tipo: 'recordatorio',
        titulo: 'Declaración próxima a vencer',
        mensaje: 'La declaración de Noviembre 2024 vence en 3 días',
        leida: false,
        createdAt: new Date()
      },
      {
        id: nanoid(),
        usuarioId: contribuyenteId,
        tipo: 'comentario',
        titulo: 'Nuevo comentario',
        mensaje: 'Tu contador agregó un comentario en Octubre 2024',
        leida: true,
        createdAt: new Date()
      }
    ])

    console.log('  ✅ 2 notificaciones creadas')

    console.log('\n✨ ¡Seed completado exitosamente!\n')
    console.log('📊 Resumen:')
    console.log('  - 2 usuarios creados')
    console.log(`  - ${meses.length} declaraciones mensuales`)
    console.log(`  - ${facturaCount} facturas`)
    console.log(`  - ${checklistCount} checklist items`)
    console.log(`  - ${comentarios.length} comentarios`)
    console.log('  - 2 notificaciones')
    console.log('\n🔐 Credenciales de acceso:')
    console.log('  Contribuyente: maria.gonzalez@test.com / TestPassword123!')
    console.log('  Contador: juan.perez@test.com / TestPassword456!')
    console.log('\n🚀 Inicia el servidor con: npm run dev')
    console.log('   Visita: http://localhost:3000\n')

  } catch (error) {
    console.error('❌ Error durante el seed:', error)
    process.exit(1)
  } finally {
    sqlite.close()
  }
}

// Ejecutar seed
seed()
