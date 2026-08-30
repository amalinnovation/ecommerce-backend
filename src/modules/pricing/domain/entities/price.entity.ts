/** Foto del precio vigente de una variante, resuelta contra la vista variant_price. */
export interface PriceSnapshot {
  variantId: string;
  amount: string; // precio regular, numeric de Postgres como string decimal
  offerAmount: string | null;
  available: number;
}
