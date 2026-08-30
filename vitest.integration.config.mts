import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';
import swc from 'unplugin-swc';

export default defineConfig({
  // Ver vitest.config.mts: esbuild no emite metadata de decoradores,
  // NestJS la necesita para inyectar por tipo de clase.
  plugins: [tsconfigPaths(), swc.vite()],
  test: {
    env: {
      SUPABASE_URL: 'http://localhost:54321',
      SUPABASE_ANON_KEY: 'test-anon-key',
      SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
      COOKIE_SECRET: 'test-cookie-secret-please-change-me-32ch',
      // DATABASE_URL NO se fija aquí a propósito: cada prueba de
      // integración levanta su propio Postgres vía Testcontainers y
      // define su propia DATABASE_URL efímera.
    },
    include: ['src/**/*.integration.spec.ts'],
    exclude: ['node_modules/**'],
    testTimeout: 30_000,
  },
});
