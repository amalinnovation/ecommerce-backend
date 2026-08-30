export const CART_PRICE_QUOTER_PORT = Symbol('CART_PRICE_QUOTER_PORT');

export interface CartLinePriceQuote {
  variantId: string;
  unitPrice: string; // offerAmount ?? amount, ya resuelto
  available: number;
}

/**
 * Interfaz propia de cart, aunque se parezca a la de catalog — cada
 * módulo declara su propio puerto para lo que necesita (sección 04 del
 * documento de arquitectura). Lo implementa pricing (ver pricing/index.ts).
 * cart nunca confía en un precio que venga del cliente: siempre lo resuelve
 * de nuevo aquí antes de sumar totales.
 */
export interface PriceQuoterPort {
  quoteMany(variantIds: string[]): Promise<Map<string, CartLinePriceQuote>>;
}
