import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';
import swc from 'unplugin-swc';

export default defineConfig({
  // Ver vitest.config.mts: esbuild no emite metadata de decoradores,
  // NestJS la necesita para inyectar por tipo de clase.
  plugins: [tsconfigPaths(), swc.vite()],
  test: {
    env: {
      // process.env.DATABASE_URL manda cuando existe (CI la fija apuntando
      // al servicio postgres del job); el valor de acá es sólo el default
      // para correr `pnpm test:e2e` en la máquina local.
      DATABASE_URL:
        process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:54322/postgres',
      SUPABASE_URL: 'http://localhost:54321',
      SUPABASE_ANON_KEY: 'test-anon-key',
      SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
      COOKIE_SECRET: 'test-cookie-secret-please-change-me-32ch',
    },
    include: ['test/**/*.e2e-spec.ts'],
    exclude: ['node_modules/**'],
    testTimeout: 30_000,
  },
});
