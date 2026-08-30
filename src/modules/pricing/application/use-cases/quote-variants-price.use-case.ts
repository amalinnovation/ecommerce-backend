import { Inject, Injectable } from '@nestjs/common';
import type { PriceSnapshot } from '../../domain/entities/price.entity';
import { PRICE_REPOSITORY_PORT, type PriceRepositoryPort } from '../../domain/ports/price-repository.port';

@Injectable()
export class QuoteVariantsPriceUseCase {
  constructor(@Inject(PRICE_REPOSITORY_PORT) private readonly prices: PriceRepositoryPort) {}

  async execute(variantIds: string[]): Promise<Map<string, PriceSnapshot>> {
    if (variantIds.length === 0) return new Map();
    return this.prices.findCurrentForVariants(variantIds);
  }
}
