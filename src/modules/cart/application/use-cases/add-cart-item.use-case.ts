import { Inject, Injectable } from '@nestjs/common';
import { CART_REPOSITORY_PORT, type CartRepositoryPort } from '../../domain/ports/cart-repository.port';
import { CART_PRICE_QUOTER_PORT, type PriceQuoterPort } from '../../domain/ports/price-quoter.port';
import { VariantOutOfStockError } from '../../domain/errors/variant-out-of-stock.error';
import { VariantPriceUnavailableError } from '../../domain/errors/variant-price-unavailable.error';
import { BuildCartSnapshotService, type CartSnapshot } from '../services/build-cart-snapshot.service';

@Injectable()
export class AddCartItemUseCase {
  constructor(
    @Inject(CART_REPOSITORY_PORT) private readonly carts: CartRepositoryPort,
    @Inject(CART_PRICE_QUOTER_PORT) private readonly priceQuoter: PriceQuoterPort,
    private readonly buildSnapshot: BuildCartSnapshotService,
  ) {}

  async execute(visitorId: string, variantId: string, quantity: number): Promise<CartSnapshot> {
    const { cart, items } = await this.carts.findOrCreateActiveForVisitor(visitorId);

    const quotes = await this.priceQuoter.quoteMany([variantId]);
    const quote = quotes.get(variantId);
    if (!quote) {
      throw new VariantPriceUnavailableError('La variante no tiene un precio vigente', { variantId });
    }

    // El envío SIEMPRE se recalcula; acá, el stock. La cantidad ya en el
    // carrito cuenta para el chequeo — no se puede burlar el límite
    // agregando de a poco.
    const alreadyInCart = items.find((item) => item.variantId === variantId)?.quantity ?? 0;
    const requested = alreadyInCart + quantity;
    if (quote.available < requested) {
      throw new VariantOutOfStockError('Stock insuficiente', {
        variantId,
        requested,
        available: quote.available,
      });
    }

    await this.carts.addItem(cart.id, variantId, quantity);
    const updatedItems = await this.carts.findItems(cart.id);
    return this.buildSnapshot.build(cart, updatedItems);
  }
}
