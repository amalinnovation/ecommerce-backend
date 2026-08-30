import { Module } from '@nestjs/common';
import { PricingModule, CatalogPriceQuoterAdapter } from '../pricing';
import { AnalyticsModule, CatalogRecommendationAdapter } from '../analytics';
import { ListCategoriesUseCase } from './application/use-cases/list-categories.use-case';
import { ListProductsUseCase } from './application/use-cases/list-products.use-case';
import { GetProductBySlugUseCase } from './application/use-cases/get-product-by-slug.use-case';
import { SearchProductsUseCase } from './application/use-cases/search-products.use-case';
import { GetRecommendationsUseCase } from './application/use-cases/get-recommendations.use-case';
import { CATEGORY_REPOSITORY_PORT } from './domain/ports/category-repository.port';
import { PRODUCT_REPOSITORY_PORT } from './domain/ports/product-repository.port';
import { CATALOG_PRICE_QUOTER_PORT } from './domain/ports/price-quoter.port';
import { CATALOG_RECOMMENDATION_PORT } from './domain/ports/recommendation.port';
import { DrizzleCategoryRepository } from './infrastructure/persistence/category.repository';
import { DrizzleProductRepository } from './infrastructure/persistence/product.repository';
import { CatalogController } from './infrastructure/http/catalog.controller';

@Module({
  imports: [PricingModule, AnalyticsModule],
  controllers: [CatalogController],
  providers: [
    ListCategoriesUseCase,
    ListProductsUseCase,
    GetProductBySlugUseCase,
    SearchProductsUseCase,
    GetRecommendationsUseCase,
    { provide: CATEGORY_REPOSITORY_PORT, useClass: DrizzleCategoryRepository },
    { provide: PRODUCT_REPOSITORY_PORT, useClass: DrizzleProductRepository },
    // useExisting, no useClass: reutiliza la instancia que PricingModule /
    // AnalyticsModule ya armaron y exportaron — useClass crearía una
    // instancia nueva cuyas propias dependencias (no exportadas) no se
    // podrían resolver en el scope de CatalogModule.
    { provide: CATALOG_PRICE_QUOTER_PORT, useExisting: CatalogPriceQuoterAdapter },
    { provide: CATALOG_RECOMMENDATION_PORT, useExisting: CatalogRecommendationAdapter },
  ],
})
export class CatalogModule {}
