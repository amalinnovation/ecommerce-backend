import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/shared/infrastructure/db/schema/*.ts',
  out: './src/shared/infrastructure/db/schema',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:54322/postgres',
  },
  // Sólo tablas/vistas del esquema public que pertenecen a nuestro dominio;
  // el resto (`auth.*`, `storage.*`, `extensions.*`, ...) lo gestiona Supabase.
  schemaFilter: ['public'],
  verbose: true,
  strict: false,
});
