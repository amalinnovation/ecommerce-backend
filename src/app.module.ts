import { Module } from '@nestjs/common';
import { ConfigModule } from './shared/config/config.module';
import { DbModule } from './shared/infrastructure/db/db.module';
import { HealthModule } from './modules/health/health.module';
import { IdentityModule } from './modules/identity';
import { PricingModule } from './modules/pricing';
import { AnalyticsModule } from './modules/analytics';
import { CatalogModule } from './modules/catalog';
import { CartModule } from './modules/cart';

@Module({
  imports: [
    ConfigModule,
    DbModule,
    HealthModule,
    IdentityModule,
    PricingModule,
    AnalyticsModule,
    CatalogModule,
    CartModule,
  ],
})
export class AppModule {}
