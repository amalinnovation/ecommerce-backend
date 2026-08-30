import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

/**
 * Conexión por el *pooler* de Supabase en modo transacción (puerto 6543).
 * Con Node de larga vida podría usarse conexión directa, pero el pooler
 * evita agotar conexiones el día que haya más de una instancia corriendo.
 */
export function createDbClient(databaseUrl: string) {
  const client = postgres(databaseUrl, { prepare: false });
  return drizzle(client, { schema });
}

export type DbClient = ReturnType<typeof createDbClient>;
