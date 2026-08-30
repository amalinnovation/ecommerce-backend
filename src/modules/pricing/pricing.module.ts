import { Module } from '@nestjs/common';
import { QuoteVariantsPriceUseCase } from './application/use-cases/quote-variants-price.use-case';
import { PRICE_REPOSITORY_PORT } from './domain/ports/price-repository.port';
import { DrizzlePriceRepository } from './infrastructure/persistence/price.repository';
import { CatalogPriceQuoterAdapter } from './infrastructure/adapters/catalog-price-quoter.adapter';
import { CartPriceQuoterAdapter } from './infrastructure/adapters/cart-price-quoter.adapter';

@Module({
  providers: [
    QuoteVariantsPriceUseCase,
    { provide: PRICE_REPOSITORY_PORT, useClass: DrizzlePriceRepository },
    CatalogPriceQuoterAdapter,
    CartPriceQuoterAdapter,
  ],
  exports: [CatalogPriceQuoterAdapter, CartPriceQuoterAdapter],
})
export class PricingModule {}
