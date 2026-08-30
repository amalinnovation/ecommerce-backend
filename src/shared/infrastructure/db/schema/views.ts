import { pgView, uuid, text, integer, numeric, timestamp } from 'drizzle-orm/pg-core';

/**
 * NO EDITAR SIN TAMBIÉN EDITAR LA MIGRACIÓN SQL. Drizzle no gestiona
 * vistas por sí solo (drizzle-kit pull las vuelca directo en schema.ts,
 * pero se saca de ahí a propósito para evitar duplicar el nombre
 * exportado) — `.existing()` le dice a Drizzle "esta vista ya está creada
 * por la migración SQL, sólo tipala". La definición real vive en
 * supabase/migrations/0002_catalog_pricing_cart_analytics.sql.
 */
export const variantPrice = pgView('variant_price', {
  variantId: uuid('variant_id').notNull(),
  productId: uuid('product_id').notNull(),
  sku: text('sku').notNull(),
  available: integer('available').notNull(),
  listAmount: numeric('list_amount', { precision: 12, scale: 2 }).notNull(),
  offerAmount: numeric('offer_amount', { precision: 12, scale: 2 }),
  price: numeric('price', { precision: 12, scale: 2 }).notNull(),
  startsAt: timestamp('starts_at', { withTimezone: true, mode: 'string' }).notNull(),
  endsAt: timestamp('ends_at', { withTimezone: true, mode: 'string' }),
}).existing();
