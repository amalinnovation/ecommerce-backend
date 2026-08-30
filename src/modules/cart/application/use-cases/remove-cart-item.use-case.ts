import { Inject, Injectable } from '@nestjs/common';
import { CART_REPOSITORY_PORT, type CartRepositoryPort } from '../../domain/ports/cart-repository.port';
import { CartItemNotFoundError } from '../../domain/errors/cart-item-not-found.error';
import { BuildCartSnapshotService, type CartSnapshot } from '../services/build-cart-snapshot.service';

@Injectable()
export class RemoveCartItemUseCase {
  constructor(
    @Inject(CART_REPOSITORY_PORT) private readonly carts: CartRepositoryPort,
    private readonly buildSnapshot: BuildCartSnapshotService,
  ) {}

  async execute(visitorId: string, cartItemId: string): Promise<CartSnapshot> {
    const item = await this.carts.findItemForVisitor(cartItemId, visitorId);
    if (!item) {
      throw new CartItemNotFoundError('Ítem de carrito no encontrado', { cartItemId });
    }

    await this.carts.removeItem(cartItemId);
    const { cart, items } = await this.carts.findOrCreateActiveForVisitor(visitorId);
    return this.buildSnapshot.build(cart, items);
  }
}
