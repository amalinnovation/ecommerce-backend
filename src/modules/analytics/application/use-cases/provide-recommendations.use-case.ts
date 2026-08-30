import { Inject, Injectable } from '@nestjs/common';
import {
  PRODUCT_SCORE_REPOSITORY_PORT,
  type ProductScoreRepositoryPort,
} from '../../domain/ports/product-score-repository.port';

@Injectable()
export class ProvideRecommendationsUseCase {
  constructor(
    @Inject(PRODUCT_SCORE_REPOSITORY_PORT) private readonly scores: ProductScoreRepositoryPort,
  ) {}

  /**
   * Heurística simple para esta fase: misma categoría, ordenado por
   * product_scores, excluyendo el producto actual. No es el motor de
   * afinidad de 4 niveles del documento original — ese necesita datos
   * reales de analytics_events que todavía no existen.
   */
  async execute(excludeProductId: string, categoryId: string, limit: number): Promise<{ productId: string }[]> {
    return this.scores.findTopByCategory(categoryId, excludeProductId, limit);
  }
}
