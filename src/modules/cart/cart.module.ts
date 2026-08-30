import { Module } from '@nestjs/common';
import { PricingModule, CartPriceQuoterAdapter } from '../pricing';
import { GetCartUseCase } from './application/use-cases/get-cart.use-case';
import { AddCartItemUseCase } from './application/use-cases/add-cart-item.use-case';
import { UpdateCartItemUseCase } from './application/use-cases/update-cart-item.use-case';
import { RemoveCartItemUseCase } from './application/use-cases/remove-cart-item.use-case';
import { BuildCartSnapshotService } from './application/services/build-cart-snapshot.service';
import { CART_REPOSITORY_PORT } from './domain/ports/cart-repository.port';
import { CART_PRICE_QUOTER_PORT } from './domain/ports/price-quoter.port';
import { DrizzleCartRepository } from './infrastructure/persistence/cart.repository';
import { CartController } from './infrastructure/http/cart.controller';

@Module({
  imports: [PricingModule],
  controllers: [CartController],
  providers: [
    GetCartUseCase,
    AddCartItemUseCase,
    UpdateCartItemUseCase,
    RemoveCartItemUseCase,
    BuildCartSnapshotService,
    { provide: CART_REPOSITORY_PORT, useClass: DrizzleCartRepository },
    // useExisting: reutiliza la instancia que PricingModule ya armó.
    { provide: CART_PRICE_QUOTER_PORT, useExisting: CartPriceQuoterAdapter },
  ],
})
export class CartModule {}
