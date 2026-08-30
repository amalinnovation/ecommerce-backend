import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, ne } from 'drizzle-orm';
import { DB_CLIENT } from '../../../../shared/infrastructure/db/db.module';
import type { DbClient } from '../../../../shared/infrastructure/db/client';
import { productScores, products } from '../../../../shared/infrastructure/db/schema';
import type { ProductScoreRepositoryPort } from '../../domain/ports/product-score-repository.port';

@Injectable()
export class DrizzleProductScoreRepository implements ProductScoreRepositoryPort {
  constructor(@Inject(DB_CLIENT) private readonly db: DbClient) {}

  async findTopByCategory(
    categoryId: string,
    excludeProductId: string,
    limit: number,
  ): Promise<{ productId: string }[]> {
    const rows = await this.db
      .select({ productId: products.id })
      .from(products)
      .innerJoin(productScores, eq(productScores.productId, products.id))
      .where(
        and(
          eq(products.categoryId, categoryId),
          eq(products.status, 'active'),
          ne(products.id, excludeProductId),
        ),
      )
      .orderBy(desc(productScores.score))
      .limit(limit);

    return rows;
  }
}
