import { Inject, Injectable } from '@nestjs/common';
import type { Product } from '../../domain/entities/product.entity';
import type { ProductVariant } from '../../domain/entities/product-variant.entity';
import { PRODUCT_REPOSITORY_PORT, type ProductRepositoryPort } from '../../domain/ports/product-repository.port';
import {
  CATALOG_PRICE_QUOTER_PORT,
  type PriceQuoterPort,
  type VariantPriceQuote,
} from '../../domain/ports/price-quoter.port';
import { ProductNotFoundError } from '../../domain/errors/product-not-found.error';

export interface ProductDetail {
  product: Product;
  variants: (ProductVariant & { price: VariantPriceQuote | null })[];
}

@Injectable()
export class GetProductBySlugUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY_PORT) private readonly products: ProductRepositoryPort,
    @Inject(CATALOG_PRICE_QUOTER_PORT) private readonly priceQuoter: PriceQuoterPort,
  ) {}

  async execute(slug: string): Promise<ProductDetail> {
    const found = await this.products.findBySlug(slug);
    if (!found) {
      throw new ProductNotFoundError(`Producto "${slug}" no encontrado`, { slug });
    }

    const quotes = await this.priceQuoter.quoteMany(found.variants.map((v) => v.id));

    return {
      product: found.product,
      // Una variante sin precio vigente se marca price:null, no rompe la
      // ficha — el producto puede tener otras variantes disponibles.
      variants: found.variants.map((variant) => ({ ...variant, price: quotes.get(variant.id) ?? null })),
    };
  }
}
