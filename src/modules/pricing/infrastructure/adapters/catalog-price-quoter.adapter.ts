import { Injectable } from '@nestjs/common';
import type {
  PriceQuoterPort,
  VariantPriceQuote,
} from '../../../catalog/domain/ports/price-quoter.port';
import { QuoteVariantsPriceUseCase } from '../../application/use-cases/quote-variants-price.use-case';

/** Implementa el puerto que catalog declaró en su propio domain/. */
@Injectable()
export class CatalogPriceQuoterAdapter implements PriceQuoterPort {
  constructor(private readonly quoteVariantsPrice: QuoteVariantsPriceUseCase) {}

  async quoteMany(variantIds: string[]): Promise<Map<string, VariantPriceQuote>> {
    const snapshots = await this.quoteVariantsPrice.execute(variantIds);
    const result = new Map<string, VariantPriceQuote>();
    for (const [variantId, snapshot] of snapshots) {
      result.set(variantId, {
        variantId,
        amount: snapshot.amount,
        offerAmount: snapshot.offerAmount,
        available: snapshot.available,
      });
    }
    return result;
  }
}
