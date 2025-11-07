import { drizzle } from 'drizzle-orm/d1'
import * as schema from './schema'

export { schema }

export function useDB() {
  // En desarrollo, retorna null y usar wrangler dev
  // En producción (Cloudflare), usar el binding DB
  return drizzle(process.env.DB as any, { schema })
}
