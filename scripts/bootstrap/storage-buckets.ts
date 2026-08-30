/**
 * Crea (o confirma que ya existen) los buckets de Storage del proyecto,
 * vía la Management API. Idempotente: si el bucket ya existe, no falla.
 *
 * El documento de arquitectura menciona "los 4 buckets y sus políticas"
 * sin listarlos — ese diseño vive en otro documento (probablemente el de
 * catálogo/contenido) que todavía no se ha traído a este repo. Por eso
 * BUCKETS abajo es un placeholder con UN bucket de ejemplo: hay que
 * reemplazarlo por la lista real antes de correr esto contra un proyecto
 * de verdad.
 *
 * Uso:
 *   SUPABASE_ACCESS_TOKEN=... SUPABASE_PROJECT_REF=... \
 *   npx tsx scripts/bootstrap/storage-buckets.ts
 */
import { managementRequest, requireEnv } from './management-api';

interface BucketSpec {
  name: string;
  public: boolean;
  fileSizeLimitMb: number;
  allowedMimeTypes: string[];
}

// TODO(B1→B2): reemplazar por los 4 buckets reales cuando se defina su diseño.
const BUCKETS: BucketSpec[] = [
  {
    name: 'product-images',
    public: true,
    fileSizeLimitMb: 5,
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
  },
];

interface ExistingBucket {
  id: string;
  name: string;
}

async function main() {
  const projectRef = requireEnv('SUPABASE_PROJECT_REF');
  console.log(`[storage-buckets] Verificando buckets del proyecto ${projectRef}…`);

  const existing = await managementRequest<ExistingBucket[]>(`/projects/${projectRef}/storage/buckets`);
  const existingNames = new Set(existing.map((b) => b.name));

  for (const bucket of BUCKETS) {
    if (existingNames.has(bucket.name)) {
      console.log(`[storage-buckets] '${bucket.name}' ya existe, se deja tal cual.`);
      continue;
    }

    await managementRequest(`/projects/${projectRef}/storage/buckets`, {
      method: 'POST',
      body: {
        name: bucket.name,
        public: bucket.public,
        file_size_limit: bucket.fileSizeLimitMb * 1024 * 1024,
        allowed_mime_types: bucket.allowedMimeTypes,
      },
    });
    console.log(`[storage-buckets] '${bucket.name}' creado.`);
  }
}

main().catch((err: unknown) => {
  console.error('[storage-buckets] Falló:', err);
  process.exitCode = 1;
});
