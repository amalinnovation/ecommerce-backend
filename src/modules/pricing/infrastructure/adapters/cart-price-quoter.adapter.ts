import { Injectable } from '@nestjs/common';
import type {
  CartLinePriceQuote,
  PriceQuoterPort,
} from '../../../cart/domain/ports/price-quoter.port';
import { QuoteVariantsPriceUseCase } from '../../application/use-cases/quote-variants-price.use-case';

/**
 * Implementa el puerto que cart declaró en su propio domain/. `unitPrice`
 * ya sale resuelto (offerAmount ?? amount) — cart no decide entre precio
 * de oferta y precio regular, eso es responsabilidad de pricing.
 */
@Injectable()
export class CartPriceQuoterAdapter implements PriceQuoterPort {
  constructor(private readonly quoteVariantsPrice: QuoteVariantsPriceUseCase) {}

  async quoteMany(variantIds: string[]): Promise<Map<string, CartLinePriceQuote>> {
    const snapshots = await this.quoteVariantsPrice.execute(variantIds);
    const result = new Map<string, CartLinePriceQuote>();
    for (const [variantId, snapshot] of snapshots) {
      result.set(variantId, {
        variantId,
        unitPrice: snapshot.offerAmount ?? snapshot.amount,
        available: snapshot.available,
      });
    }
    return result;
  }
}
