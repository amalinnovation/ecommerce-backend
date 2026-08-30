export const CATALOG_PRICE_QUOTER_PORT = Symbol('CATALOG_PRICE_QUOTER_PORT');

export interface VariantPriceQuote {
  variantId: string;
  amount: string; // precio regular, string decimal (numeric de Postgres)
  offerAmount: string | null;
  available: number;
}

/**
 * Lo que catalog necesita saber del precio de una variante para mostrar la
 * ficha de un producto. Lo implementa pricing (ver pricing/index.ts).
 */
export interface PriceQuoterPort {
  quoteMany(variantIds: string[]): Promise<Map<string, VariantPriceQuote>>;
}
