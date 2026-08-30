import { Inject, Injectable } from '@nestjs/common';
import { CART_REPOSITORY_PORT, type CartRepositoryPort } from '../../domain/ports/cart-repository.port';
import { BuildCartSnapshotService, type CartSnapshot } from '../services/build-cart-snapshot.service';

@Injectable()
export class GetCartUseCase {
  constructor(
    @Inject(CART_REPOSITORY_PORT) private readonly carts: CartRepositoryPort,
    private readonly buildSnapshot: BuildCartSnapshotService,
  ) {}

  /** Nunca da 404: si el visitante no tiene carrito, se crea uno vacío. */
  async execute(visitorId: string): Promise<CartSnapshot> {
    const { cart, items } = await this.carts.findOrCreateActiveForVisitor(visitorId);
    return this.buildSnapshot.build(cart, items);
  }
}
