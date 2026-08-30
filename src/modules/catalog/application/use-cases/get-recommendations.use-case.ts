import { Inject, Injectable } from '@nestjs/common';
import type { Product } from '../../domain/entities/product.entity';
import { PRODUCT_REPOSITORY_PORT, type ProductRepositoryPort } from '../../domain/ports/product-repository.port';
import {
  CATALOG_RECOMMENDATION_PORT,
  type RecommendationPort,
} from '../../domain/ports/recommendation.port';
import { ProductNotFoundError } from '../../domain/errors/product-not-found.error';

@Injectable()
export class GetRecommendationsUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY_PORT) private readonly products: ProductRepositoryPort,
    @Inject(CATALOG_RECOMMENDATION_PORT) private readonly recommendations: RecommendationPort,
  ) {}

  async execute(productId: string, limit: number): Promise<Product[]> {
    const [product] = await this.products.findManyByIds([productId]);
    if (!product) {
      throw new ProductNotFoundError(`Producto "${productId}" no encontrado`, { productId });
    }

    const recs = await this.recommendations.recommend(productId, product.categoryId, limit);
    if (recs.length === 0) return [];

    const hydrated = await this.products.findManyByIds(recs.map((r) => r.productId));
    const byId = new Map(hydrated.map((p) => [p.id, p]));

    // findManyByIds no garantiza el orden — lo reordenamos según lo que
    // devolvió el puerto de recomendaciones (ya viene ordenado por score).
    return recs.map((r) => byId.get(r.productId)).filter((p): p is Product => p !== undefined);
  }
}
