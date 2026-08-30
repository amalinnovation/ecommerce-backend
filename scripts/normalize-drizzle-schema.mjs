#!/usr/bin/env node
// `drizzle-kit pull` no puede tipar la columna generada `search_vector`
// (tsvector) ni gestionar la vista `variant_price` — cada vez que corre,
// vuelca un stub roto para la primera y duplica la segunda (que se tipa
// a mano en views.ts con `.existing()`). Sin esto, `db:pull` y
// `db-drift-check.sh` "detectarían deriva" en cada corrida aunque la
// base no haya cambiado nada. Este script aplica la misma limpieza que
// se documenta a mano en schema.ts, de forma determinista.
//
// Uso: node scripts/normalize-drizzle-schema.mjs <ruta-a-schema.ts>
import { readFileSync, writeFileSync } from 'node:fs';

const path = process.argv[2];
if (!path) {
  console.error('Uso: node scripts/normalize-drizzle-schema.mjs <ruta-a-schema.ts>');
  process.exit(1);
}

let content = readFileSync(path, 'utf8');

content = content.replace(', pgView } from "drizzle-orm/pg-core"', ' } from "drizzle-orm/pg-core"');

content = content.replace(
  /\t\/\/ TODO: failed to parse database type 'tsvector'\n\tsearchVector: unknown\("search_vector"\)\.generatedAlwaysAs\(sql`[^`]*`\),\n/,
  '\t// search_vector (tsvector, generated always as ...) queda sin tipar: Drizzle\n' +
    "\t// no tiene un column builder nativo para tsvector. No hace falta tiparlo —\n" +
    '\t// nunca se escribe desde la aplicación (columna generada por Postgres) y las\n' +
    '\t// búsquedas se hacen con sql`` crudo en product.repository.ts, que sí puede\n' +
    '\t// referenciar "search_vector" por nombre sin que Drizzle lo conozca.\n',
);

content = content.replace(
  /\t\tidxProductsSearchVector: index\("idx_products_search_vector"\)[^\n]*\n/,
  '\t\t// idx_products_search_vector (GIN sobre search_vector) existe en Postgres\n' +
    '\t\t// (migración 0002) pero no se declara acá: depende de la columna\n' +
    '\t\t// search_vector, que Drizzle no tipa (ver comentario más arriba).\n',
);

content = content.replace(
  /\nexport const variantPrice = pgView\("variant_price", \{[\s\S]*?\}\)\.as\(sql`[^`]*`\);/,
  '\n// variant_price se tipa a mano en ./views.ts con `.existing()`, no acá —\n' +
    '// ver ese archivo para el porqué.',
);

writeFileSync(path, content);
