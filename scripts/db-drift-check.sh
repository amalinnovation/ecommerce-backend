#!/usr/bin/env bash
# Detecta deriva entre el esquema real de Postgres y los tipos comprometidos
# de Drizzle. Si alguien tocó la base a mano desde el panel de Supabase,
# esto lo delata antes de que cause un misterio (sección 06 del plan de
# arquitectura).
#
# drizzle-kit no permite combinar --out con --config, así que en vez de
# volcar a un directorio aparte, hacemos un respaldo del esquema
# comprometido, dejamos que `pull` sobrescriba en su sitio (tal como lo
# usaría un desarrollador con `pnpm db:pull`), y comparamos. Si hay
# deriva, los archivos regenerados quedan en el árbol de trabajo listos
# para revisar y comitear.
set -euo pipefail

SCHEMA_DIR="src/shared/infrastructure/db/schema"
BACKUP_DIR="$(mktemp -d)"
trap 'rm -rf "$BACKUP_DIR"' EXIT

cp -R "$SCHEMA_DIR/." "$BACKUP_DIR/"

npx drizzle-kit pull --config drizzle.config.ts >/dev/null
# Sin esto, cada corrida "detecta deriva" por el stub roto de tsvector y
# la vista duplicada que drizzle-kit vuelca solo — ver el comentario en
# scripts/normalize-drizzle-schema.mjs.
node scripts/normalize-drizzle-schema.mjs "$SCHEMA_DIR/schema.ts"

if ! diff -r "$BACKUP_DIR" "$SCHEMA_DIR"; then
  echo "::error::El esquema de Postgres cambió sin regenerar $SCHEMA_DIR. Revisa el diff de arriba, corre 'pnpm db:pull' si hace falta, y comitea el resultado." >&2
  exit 1
fi

echo "db-drift-check: sin deriva."
