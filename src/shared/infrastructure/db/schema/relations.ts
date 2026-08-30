import { relations } from "drizzle-orm/relations";
import { categories, products, productVariants, prices, productScores, visitors, carts, analyticsEvents, cartItems } from "./schema";

export const productsRelations = relations(products, ({one, many}) => ({
	category: one(categories, {
		fields: [products.categoryId],
		references: [categories.id]
	}),
	productVariants: many(productVariants),
	productScores: many(productScores),
}));

export const categoriesRelations = relations(categories, ({one, many}) => ({
	products: many(products),
	category: one(categories, {
		fields: [categories.parentId],
		references: [categories.id],
		relationName: "categories_parentId_categories_id"
	}),
	categories: many(categories, {
		relationName: "categories_parentId_categories_id"
	}),
}));

export const productVariantsRelations = relations(productVariants, ({one, many}) => ({
	product: one(products, {
		fields: [productVariants.productId],
		references: [products.id]
	}),
	prices: many(prices),
	cartItems: many(cartItems),
}));

export const pricesRelations = relations(prices, ({one}) => ({
	productVariant: one(productVariants, {
		fields: [prices.variantId],
		references: [productVariants.id]
	}),
}));

export const productScoresRelations = relations(productScores, ({one}) => ({
	product: one(products, {
		fields: [productScores.productId],
		references: [products.id]
	}),
}));

export const cartsRelations = relations(carts, ({one, many}) => ({
	visitor: one(visitors, {
		fields: [carts.visitorId],
		references: [visitors.id]
	}),
	cartItems: many(cartItems),
}));

export const visitorsRelations = relations(visitors, ({many}) => ({
	carts: many(carts),
	analyticsEvents: many(analyticsEvents),
}));

export const analyticsEventsRelations = relations(analyticsEvents, ({one}) => ({
	visitor: one(visitors, {
		fields: [analyticsEvents.visitorId],
		references: [visitors.id]
	}),
}));

export const cartItemsRelations = relations(cartItems, ({one}) => ({
	cart: one(carts, {
		fields: [cartItems.cartId],
		references: [carts.id]
	}),
	productVariant: one(productVariants, {
		fields: [cartItems.variantId],
		references: [productVariants.id]
	}),
}));