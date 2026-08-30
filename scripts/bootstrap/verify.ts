/**
 * Confirma que el guion de arranque dejó el proyecto como debía.
 * Corre auth-providers y storage-buckets, y al final verifica el
 * resultado contra la Management API. Pensado para correr en CI o a mano
 * después de aprovisionar un proyecto nuevo (sección 11 del plan de
 * arquitectura, carpeta infra/bootstrap/).
 *
 * Uso:
 *   SUPABASE_ACCESS_TOKEN=... SUPABASE_PROJECT_REF=... \
 *   GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=... \
 *   npx tsx scripts/bootstrap/verify.ts
 */
import { managementRequest, requireEnv } from './management-api';

interface AuthConfig {
  external_google_enabled: boolean;
  external_email_enabled: boolean;
}

interface ExistingBucket {
  name: string;
}

async function main() {
  const projectRef = requireEnv('SUPABASE_PROJECT_REF');
  let ok = true;

  const auth = await managementRequest<AuthConfig>(`/projects/${projectRef}/config/auth`);
  if (!auth.external_google_enabled) {
    console.error('[verify] Google auth NO está habilitado.');
    ok = false;
  }
  if (!auth.external_email_enabled) {
    console.error('[verify] Auth por correo NO está habilitado.');
    ok = false;
  }

  const buckets = await managementRequest<ExistingBucket[]>(`/projects/${projectRef}/storage/buckets`);
  if (!buckets.some((b) => b.name === 'product-images')) {
    console.error("[verify] Falta el bucket 'product-images'.");
    ok = false;
  }

  if (!ok) {
    console.error('[verify] El arranque quedó incompleto.');
    process.exitCode = 1;
    return;
  }

  console.log('[verify] El arranque quedó como debía.');
}

main().catch((err: unknown) => {
  console.error('[verify] Falló:', err);
  process.exitCode = 1;
});
