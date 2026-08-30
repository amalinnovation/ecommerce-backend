import { Inject, Injectable } from '@nestjs/common';
import { inArray } from 'drizzle-orm';
import { DB_CLIENT } from '../../../../shared/infrastructure/db/db.module';
import type { DbClient } from '../../../../shared/infrastructure/db/client';
import { variantPrice } from '../../../../shared/infrastructure/db/schema';
import type { PriceSnapshot } from '../../domain/entities/price.entity';
import type { PriceRepositoryPort } from '../../domain/ports/price-repository.port';

@Injectable()
export class DrizzlePriceRepository implements PriceRepositoryPort {
  constructor(@Inject(DB_CLIENT) private readonly db: DbClient) {}

  async findCurrentForVariants(variantIds: string[]): Promise<Map<string, PriceSnapshot>> {
    const rows = await this.db
      .select({
        variantId: variantPrice.variantId,
        amount: variantPrice.listAmount,
        offerAmount: variantPrice.offerAmount,
        available: variantPrice.available,
      })
      .from(variantPrice)
      .where(inArray(variantPrice.variantId, variantIds));

    const result = new Map<string, PriceSnapshot>();
    for (const row of rows) {
      result.set(row.variantId, {
        variantId: row.variantId,
        amount: row.amount,
        offerAmount: row.offerAmount,
        available: row.available,
      });
    }
    return result;
  }
}
