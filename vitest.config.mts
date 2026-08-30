import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';
import swc from 'unplugin-swc';

const testEnv = {
  // Valores de relleno para que ConfigModule valide en pruebas sin una
  // base de datos real. Las pruebas de integración que sí necesitan
  // Postgres levantan su propio Testcontainers y sobrescriben DATABASE_URL.
  DATABASE_URL: 'postgresql://postgres:postgres@localhost:54322/postgres',
  SUPABASE_URL: 'http://localhost:54321',
  SUPABASE_ANON_KEY: 'test-anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
  COOKIE_SECRET: 'test-cookie-secret-please-change-me-32ch',
};

export default defineConfig({
  // unplugin-swc: esbuild (el transform por defecto de Vite/Vitest) NO
  // emite `design:paramtypes` (metadata de decoradores). NestJS depende
  // de esa metadata para inyectar por tipo de clase sin @Inject()
  // explícito — sin esto, cualquier constructor que inyecte "por tipo"
  // recibe `undefined` en pruebas, aunque funcione perfecto con
  // `nest build`/`tsc`. swc sí emite esa metadata, igual que tsc.
  plugins: [tsconfigPaths(), swc.vite()],
  test: {
    env: testEnv,
    include: ['src/**/*.spec.ts'],
    exclude: ['src/**/*.integration.spec.ts', 'src/**/*.e2e-spec.ts', 'node_modules/**'],
  },
});
