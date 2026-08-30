import { Inject, Injectable } from '@nestjs/common';
import { CART_REPOSITORY_PORT, type CartRepositoryPort } from '../../domain/ports/cart-repository.port';
import { CART_PRICE_QUOTER_PORT, type PriceQuoterPort } from '../../domain/ports/price-quoter.port';
import { CartItemNotFoundError } from '../../domain/errors/cart-item-not-found.error';
import { VariantOutOfStockError } from '../../domain/errors/variant-out-of-stock.error';
import { VariantPriceUnavailableError } from '../../domain/errors/variant-price-unavailable.error';
import { BuildCartSnapshotService, type CartSnapshot } from '../services/build-cart-snapshot.service';

@Injectable()
export class UpdateCartItemUseCase {
  constructor(
    @Inject(CART_REPOSITORY_PORT) private readonly carts: CartRepositoryPort,
    @Inject(CART_PRICE_QUOTER_PORT) private readonly priceQuoter: PriceQuoterPort,
    private readonly buildSnapshot: BuildCartSnapshotService,
  ) {}

  async execute(visitorId: string, cartItemId: string, quantity: number): Promise<CartSnapshot> {
    const item = await this.carts.findItemForVisitor(cartItemId, visitorId);
    if (!item) {
      throw new CartItemNotFoundError('Ítem de carrito no encontrado', { cartItemId });
    }

    const quotes = await this.priceQuoter.quoteMany([item.variantId]);
    const quote = quotes.get(item.variantId);
    if (!quote) {
      throw new VariantPriceUnavailableError('La variante no tiene un precio vigente', {
        variantId: item.variantId,
      });
    }
    if (quote.available < quantity) {
      throw new VariantOutOfStockError('Stock insuficiente', {
        variantId: item.variantId,
        requested: quantity,
        available: quote.available,
      });
    }

    await this.carts.setItemQuantity(cartItemId, quantity);
    const { cart, items } = await this.carts.findOrCreateActiveForVisitor(visitorId);
    return this.buildSnapshot.build(cart, items);
  }
}
