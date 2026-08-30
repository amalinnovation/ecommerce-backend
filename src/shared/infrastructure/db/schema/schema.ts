import { pgTable, text, timestamp, index, foreignKey, unique, check, uuid, boolean, integer, jsonb, uniqueIndex, numeric } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const appMeta = pgTable("app_meta", {
	key: text().primaryKey().notNull(),
	value: text().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const products = pgTable("products", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	categoryId: uuid("category_id").notNull(),
	slug: text().notNull(),
	name: text().notNull(),
	description: text(),
	status: text().default('active').notNull(),
	isFeatured: boolean("is_featured").default(false).notNull(),
	// search_vector (tsvector, generated always as ...) queda sin tipar: Drizzle
	// no tiene un column builder nativo para tsvector. No hace falta tiparlo —
	// nunca se escribe desde la aplicación (columna generada por Postgres) y las
	// búsquedas se hacen con sql`` crudo en product.repository.ts, que sí puede
	// referenciar "search_vector" por nombre sin que Drizzle lo conozca.
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		idxProductsCategoryId: index("idx_products_category_id").using("btree", table.categoryId.asc().nullsLast().op("uuid_ops")),
		// idx_products_search_vector (GIN sobre search_vector) existe en Postgres
		// (migración 0002) pero no se declara acá: depende de la columna
		// search_vector, que Drizzle no tipa (ver comentario más arriba).
		idxProductsStatusCreatedAt: index("idx_products_status_created_at").using("btree", table.status.asc().nullsLast().op("uuid_ops"), table.createdAt.desc().nullsFirst().op("text_ops"), table.id.asc().nullsLast().op("text_ops")),
		productsCategoryIdFkey: foreignKey({
			columns: [table.categoryId],
			foreignColumns: [categories.id],
			name: "products_category_id_fkey"
		}),
		productsSlugKey: unique("products_slug_key").on(table.slug),
		productsStatusCheck: check("products_status_check", sql`status = ANY (ARRAY['active'::text, 'draft'::text, 'archived'::text])`),
	}
});

export const categories = pgTable("categories", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	parentId: uuid("parent_id"),
	name: text().notNull(),
	slug: text().notNull(),
	position: integer().default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		idxCategoriesParentId: index("idx_categories_parent_id").using("btree", table.parentId.asc().nullsLast().op("uuid_ops")),
		categoriesParentIdFkey: foreignKey({
			columns: [table.parentId],
			foreignColumns: [table.id],
			name: "categories_parent_id_fkey"
		}).onDelete("restrict"),
		categoriesSlugKey: unique("categories_slug_key").on(table.slug),
	}
});

export const productVariants = pgTable("product_variants", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	productId: uuid("product_id").notNull(),
	sku: text().notNull(),
	attributes: jsonb().default({}).notNull(),
	stock: integer().default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		idxProductVariantsProductId: index("idx_product_variants_product_id").using("btree", table.productId.asc().nullsLast().op("uuid_ops")),
		productVariantsProductIdFkey: foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "product_variants_product_id_fkey"
		}).onDelete("cascade"),
		productVariantsSkuKey: unique("product_variants_sku_key").on(table.sku),
		productVariantsStockCheck: check("product_variants_stock_check", sql`stock >= 0`),
	}
});

export const prices = pgTable("prices", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	variantId: uuid("variant_id").notNull(),
	amount: numeric({ precision: 12, scale:  2 }).notNull(),
	offerAmount: numeric("offer_amount", { precision: 12, scale:  2 }),
	startsAt: timestamp("starts_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	endsAt: timestamp("ends_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		idxPricesVariantIdStartsAt: index("idx_prices_variant_id_starts_at").using("btree", table.variantId.asc().nullsLast().op("timestamptz_ops"), table.startsAt.desc().nullsFirst().op("timestamptz_ops")),
		uxPricesVariantOpen: uniqueIndex("ux_prices_variant_open").using("btree", table.variantId.asc().nullsLast().op("uuid_ops")).where(sql`(ends_at IS NULL)`),
		pricesVariantIdFkey: foreignKey({
			columns: [table.variantId],
			foreignColumns: [productVariants.id],
			name: "prices_variant_id_fkey"
		}).onDelete("cascade"),
		pricesAmountCheck: check("prices_amount_check", sql`amount >= (0)::numeric`),
		pricesCheck: check("prices_check", sql`(offer_amount IS NULL) OR ((offer_amount >= (0)::numeric) AND (offer_amount < amount))`),
		pricesCheck1: check("prices_check1", sql`(ends_at IS NULL) OR (ends_at > starts_at)`),
	}
});

export const productScores = pgTable("product_scores", {
	productId: uuid("product_id").primaryKey().notNull(),
	score: numeric({ precision: 10, scale:  4 }).default('0').notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		idxProductScoresScore: index("idx_product_scores_score").using("btree", table.score.desc().nullsFirst().op("numeric_ops")),
		productScoresProductIdFkey: foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "product_scores_product_id_fkey"
		}).onDelete("cascade"),
	}
});

export const visitors = pgTable("visitors", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	lastSeenAt: timestamp("last_seen_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const carts = pgTable("carts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	visitorId: uuid("visitor_id").notNull(),
	status: text().default('active').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		uxCartsVisitorActive: uniqueIndex("ux_carts_visitor_active").using("btree", table.visitorId.asc().nullsLast().op("uuid_ops")).where(sql`(status = 'active'::text)`),
		cartsVisitorIdFkey: foreignKey({
			columns: [table.visitorId],
			foreignColumns: [visitors.id],
			name: "carts_visitor_id_fkey"
		}).onDelete("cascade"),
		cartsStatusCheck: check("carts_status_check", sql`status = ANY (ARRAY['active'::text, 'abandoned'::text, 'converted'::text])`),
	}
});

export const analyticsEvents = pgTable("analytics_events", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	visitorId: uuid("visitor_id"),
	eventType: text("event_type").notNull(),
	payload: jsonb().default({}).notNull(),
	occurredAt: timestamp("occurred_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	receivedAt: timestamp("received_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		idxAnalyticsEventsEventType: index("idx_analytics_events_event_type").using("btree", table.eventType.asc().nullsLast().op("text_ops")),
		idxAnalyticsEventsOccurredAt: index("idx_analytics_events_occurred_at").using("btree", table.occurredAt.asc().nullsLast().op("timestamptz_ops")),
		idxAnalyticsEventsVisitorId: index("idx_analytics_events_visitor_id").using("btree", table.visitorId.asc().nullsLast().op("uuid_ops")),
		analyticsEventsVisitorIdFkey: foreignKey({
			columns: [table.visitorId],
			foreignColumns: [visitors.id],
			name: "analytics_events_visitor_id_fkey"
		}).onDelete("set null"),
		analyticsEventsEventTypeCheck: check("analytics_events_event_type_check", sql`event_type ~ '^[a-z0-9_.]+$'::text`),
	}
});

export const cartItems = pgTable("cart_items", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	cartId: uuid("cart_id").notNull(),
	variantId: uuid("variant_id").notNull(),
	quantity: integer().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		idxCartItemsCartId: index("idx_cart_items_cart_id").using("btree", table.cartId.asc().nullsLast().op("uuid_ops")),
		cartItemsCartIdFkey: foreignKey({
			columns: [table.cartId],
			foreignColumns: [carts.id],
			name: "cart_items_cart_id_fkey"
		}).onDelete("cascade"),
		cartItemsVariantIdFkey: foreignKey({
			columns: [table.variantId],
			foreignColumns: [productVariants.id],
			name: "cart_items_variant_id_fkey"
		}),
		cartItemsCartIdVariantIdKey: unique("cart_items_cart_id_variant_id_key").on(table.cartId, table.variantId),
		cartItemsQuantityCheck: check("cart_items_quantity_check", sql`quantity > 0`),
	}
});
// variant_price se tipa a mano en ./views.ts con `.existing()`, no acá —
// ver ese archivo para el porqué.