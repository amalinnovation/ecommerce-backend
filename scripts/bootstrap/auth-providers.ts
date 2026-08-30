/**
 * Configura los proveedores de auth (Google + correo) del proyecto de
 * Supabase vía la Management API. Idempotente: se puede correr varias
 * veces sin duplicar nada, porque es un PATCH sobre la configuración,
 * no una creación.
 *
 * Uso:
 *   SUPABASE_ACCESS_TOKEN=... SUPABASE_PROJECT_REF=... \
 *   GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=... \
 *   npx tsx scripts/bootstrap/auth-providers.ts
 */
import { managementRequest, requireEnv } from './management-api';

async function main() {
  const projectRef = requireEnv('SUPABASE_PROJECT_REF');
  const googleClientId = requireEnv('GOOGLE_CLIENT_ID');
  const googleClientSecret = requireEnv('GOOGLE_CLIENT_SECRET');

  console.log(`[auth-providers] Configurando auth para el proyecto ${projectRef}…`);

  await managementRequest(`/projects/${projectRef}/config/auth`, {
    method: 'PATCH',
    body: {
      external_google_enabled: true,
      external_google_client_id: googleClientId,
      external_google_secret: googleClientSecret,
      external_email_enabled: true,
      mailer_autoconfirm: false,
    },
  });

  console.log('[auth-providers] Google + correo configurados.');
}

main().catch((err: unknown) => {
  console.error('[auth-providers] Falló:', err);
  process.exitCode = 1;
});
