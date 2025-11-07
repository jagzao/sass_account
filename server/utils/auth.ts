import { Lucia } from 'lucia'
import { D1Adapter } from '@lucia-auth/adapter-sqlite'
import type { Usuario } from '../db/schema'

export function initializeLucia(D1: D1Database) {
  const adapter = new D1Adapter(D1, {
    user: 'usuarios',
    session: 'sessions'
  })

  return new Lucia(adapter, {
    sessionCookie: {
      attributes: {
        secure: !import.meta.dev
      }
    },
    getUserAttributes: (attributes) => {
      return {
        email: attributes.email,
        nombre: attributes.nombre,
        apellidos: attributes.apellidos,
        rol: attributes.rol,
        rfc: attributes.rfc,
        telefono: attributes.telefono,
        avatarUrl: attributes.avatar_url,
        despacho: attributes.despacho,
        regimenFiscal: attributes.regimen_fiscal,
        contadorAsignadoId: attributes.contador_asignado_id
      }
    }
  })
}

declare module 'lucia' {
  interface Register {
    Lucia: ReturnType<typeof initializeLucia>
    DatabaseUserAttributes: Omit<Usuario, 'id' | 'hashedPassword'>
  }
}
