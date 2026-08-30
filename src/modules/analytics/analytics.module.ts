import { Module } from '@nestjs/common';
import { IngestEventsUseCase } from './application/use-cases/ingest-events.use-case';
import { ProvideRecommendationsUseCase } from './application/use-cases/provide-recommendations.use-case';
import { ANALYTICS_EVENT_REPOSITORY_PORT } from './domain/ports/analytics-event-repository.port';
import { PRODUCT_SCORE_REPOSITORY_PORT } from './domain/ports/product-score-repository.port';
import { DrizzleAnalyticsEventRepository } from './infrastructure/persistence/analytics-event.repository';
import { DrizzleProductScoreRepository } from './infrastructure/persistence/product-score.repository';
import { CatalogRecommendationAdapter } from './infrastructure/adapters/catalog-recommendation.adapter';
import { AnalyticsController } from './infrastructure/http/analytics.controller';

@Module({
  controllers: [AnalyticsController],
  providers: [
    IngestEventsUseCase,
    ProvideRecommendationsUseCase,
    { provide: ANALYTICS_EVENT_REPOSITORY_PORT, useClass: DrizzleAnalyticsEventRepository },
    { provide: PRODUCT_SCORE_REPOSITORY_PORT, useClass: DrizzleProductScoreRepository },
    CatalogRecommendationAdapter,
  ],
  exports: [CatalogRecommendationAdapter],
})
export class AnalyticsModule {}
