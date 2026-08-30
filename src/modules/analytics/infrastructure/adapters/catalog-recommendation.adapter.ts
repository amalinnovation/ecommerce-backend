import { Injectable } from '@nestjs/common';
import type { RecommendationPort } from '../../../catalog/domain/ports/recommendation.port';
import { ProvideRecommendationsUseCase } from '../../application/use-cases/provide-recommendations.use-case';

/** Implementa el puerto que catalog declaró en su propio domain/. */
@Injectable()
export class CatalogRecommendationAdapter implements RecommendationPort {
  constructor(private readonly provideRecommendations: ProvideRecommendationsUseCase) {}

  async recommend(excludeProductId: string, categoryId: string, limit: number): Promise<{ productId: string }[]> {
    return this.provideRecommendations.execute(excludeProductId, categoryId, limit);
  }
}
