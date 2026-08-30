import { Money } from '../value-objects/money';

export interface CartLineSnapshot {
  cartItemId: string;
  variantId: string;
  quantity: number;
  unitPrice: string | null;
  lineTotal: string | null;
  /** true si la variante ya no tiene un precio vigente — se excluye del subtotal. */
  priceUnavailable: boolean;
}

export interface CartTotalsSnapshot {
  lines: CartLineSnapshot[];
  subtotal: string;
}

/**
 * Función pura: no toca la red ni la DB. Recibe las líneas del carrito y
 * los precios ya resueltos (vía PriceQuoterPort) y calcula los totales.
 * Una línea sin precio vigente se marca priceUnavailable y NO participa
 * del subtotal — así GetCartUseCase nunca rompe por un producto retirado.
 */
export function calculateCartTotals(
  items: { id: string; variantId: string; quantity: number }[],
  quotes: Map<string, { unitPrice: string }>,
): CartTotalsSnapshot {
  let subtotal = Money.zero();

  const lines = items.map((item): CartLineSnapshot => {
    const quote = quotes.get(item.variantId);
    if (!quote) {
      return {
        cartItemId: item.id,
        variantId: item.variantId,
        quantity: item.quantity,
        unitPrice: null,
        lineTotal: null,
        priceUnavailable: true,
      };
    }

    const unitPrice = Money.fromDecimalString(quote.unitPrice);
    const lineTotal = unitPrice.multiply(item.quantity);
    subtotal = subtotal.add(lineTotal);

    return {
      cartItemId: item.id,
      variantId: item.variantId,
      quantity: item.quantity,
      unitPrice: quote.unitPrice,
      lineTotal: lineTotal.toDecimalString(),
      priceUnavailable: false,
    };
  });

  return { lines, subtotal: subtotal.toDecimalString() };
}
