import { Inject, Injectable } from '@nestjs/common';
import type { Cart } from '../../domain/entities/cart.entity';
import type { CartItem } from '../../domain/entities/cart-item.entity';
import { calculateCartTotals, type CartTotalsSnapshot } from '../../domain/services/cart-totals-calculator';
import { CART_PRICE_QUOTER_PORT, type PriceQuoterPort } from '../../domain/ports/price-quoter.port';

export interface CartSnapshot extends CartTotalsSnapshot {
  cartId: string;
  status: Cart['status'];
}

/**
 * Reusado por los 4 casos de uso: después de cualquier escritura, se
 * reconstruye el carrito completo con precios recién resueltos — nunca se
 * devuelve un precio guardado de antes.
 */
@Injectable()
export class BuildCartSnapshotService {
  constructor(@Inject(CART_PRICE_QUOTER_PORT) private readonly priceQuoter: PriceQuoterPort) {}

  async build(cart: Cart, items: CartItem[]): Promise<CartSnapshot> {
    const quotes = await this.priceQuoter.quoteMany(items.map((item) => item.variantId));
    const totals = calculateCartTotals(items, quotes);
    return { cartId: cart.id, status: cart.status, ...totals };
  }
}
