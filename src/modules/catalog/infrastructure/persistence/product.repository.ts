import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, gt, inArray, lt, or, sql } from 'drizzle-orm';
import { DB_CLIENT } from '../../../../shared/infrastructure/db/db.module';
import type { DbClient } from '../../../../shared/infrastructure/db/client';
import { products, productVariants, variantPrice } from '../../../../shared/infrastructure/db/schema';
import type { Product } from '../../domain/entities/product.entity';
import type { ProductVariant } from '../../domain/entities/product-variant.entity';
import { decodeCursor, encodeCursor } from '../../domain/value-objects/cursor';
import type {
  ListProductsFilter,
  ProductListPage,
  ProductRepositoryPort,
  SearchResultItem,
} from '../../domain/ports/product-repository.port';

@Injectable()
export class DrizzleProductRepository implements ProductRepositoryPort {
  constructor(@Inject(DB_CLIENT) private readonly db: DbClient) {}

  async listActive(filter: ListProductsFilter): Promise<ProductListPage> {
    const conditions = [eq(products.status, 'active')];

    if (filter.categoryId) {
      conditions.push(eq(products.categoryId, filter.categoryId));
    }

    if (filter.cursor) {
      const decoded = decodeCursor(filter.cursor);
      // Un cursor corrupto o de otro formato se ignora — la página
      // simplemente arranca desde el principio, en vez de dar un 400
      // por algo que el propio backend generó y el cliente sólo pasa de
      // vuelta.
      if (decoded) {
        conditions.push(
          or(
            lt(products.createdAt, decoded.createdAt),
            and(eq(products.createdAt, decoded.createdAt), lt(products.id, decoded.id)),
          )!,
        );
      }
    }

    const fromPriceExpr = sql<string | null>`min(${variantPrice.price})`;
    const havingConditions = [];
    if (filter.minPrice) havingConditions.push(sql`${fromPriceExpr} >= ${filter.minPrice}`);
    if (filter.maxPrice) havingConditions.push(sql`${fromPriceExpr} <= ${filter.maxPrice}`);

    const rows = await this.db
      .select({
        id: products.id,
        slug: products.slug,
        name: products.name,
        categoryId: products.categoryId,
        isFeatured: products.isFeatured,
        createdAt: products.createdAt,
        fromPrice: fromPriceExpr,
      })
      .from(products)
      .leftJoin(
        variantPrice,
        and(eq(variantPrice.productId, products.id), gt(variantPrice.available, 0)),
      )
      .where(and(...conditions))
      .groupBy(products.id)
      .having(havingConditions.length > 0 ? and(...havingConditions) : undefined)
      .orderBy(desc(products.createdAt), desc(products.id))
      .limit(filter.limit + 1);

    const hasMore = rows.length > filter.limit;
    const page = hasMore ? rows.slice(0, filter.limit) : rows;
    const last = page[page.length - 1];

    return {
      items: page.map((row) => ({
        id: row.id,
        slug: row.slug,
        name: row.name,
        categoryId: row.categoryId,
        isFeatured: row.isFeatured,
        fromPrice: row.fromPrice,
        createdAt: new Date(row.createdAt),
      })),
      nextCursor: hasMore && last ? encodeCursor({ createdAt: last.createdAt, id: last.id }) : null,
    };
  }

  async findBySlug(slug: string): Promise<{ product: Product; variants: ProductVariant[] } | null> {
    const [productRow] = await this.db
      .select()
      .from(products)
      .where(and(eq(products.slug, slug), eq(products.status, 'active')))
      .limit(1);
    if (!productRow) return null;

    const variantRows = await this.db
      .select()
      .from(productVariants)
      .where(eq(productVariants.productId, productRow.id));

    return {
      product: toProductDomain(productRow),
      variants: variantRows.map(toVariantDomain),
    };
  }

  async search(query: string, limit: number): Promise<SearchResultItem[]> {
    // sql`` crudo porque Drizzle no tipa la columna search_vector (ver el
    // comentario en shared/infrastructure/db/schema/schema.ts).
    const rows = await this.db.execute<{
      id: string;
      slug: string;
      name: string;
      from_price: string | null;
      rank: number;
    }>(sql`
      select
        p.id, p.slug, p.name,
        min(vp.price) as from_price,
        ts_rank(p.search_vector, websearch_to_tsquery('spanish', ${query})) as rank
      from products p
      left join variant_price vp on vp.product_id = p.id and vp.available > 0
      where p.status = 'active'
        and p.search_vector @@ websearch_to_tsquery('spanish', ${query})
      group by p.id
      order by rank desc
      limit ${limit}
    `);

    return rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      fromPrice: row.from_price,
      rank: row.rank,
    }));
  }

  async findManyByIds(ids: string[]): Promise<Product[]> {
    if (ids.length === 0) return [];
    const rows = await this.db.select().from(products).where(inArray(products.id, ids));
    return rows.map(toProductDomain);
  }
}

function toProductDomain(row: typeof products.$inferSelect): Product {
  return {
    id: row.id,
    categoryId: row.categoryId,
    slug: row.slug,
    name: row.name,
    description: row.description,
    status: row.status as Product['status'],
    isFeatured: row.isFeatured,
    createdAt: new Date(row.createdAt),
  };
}

function toVariantDomain(row: typeof productVariants.$inferSelect): ProductVariant {
  return {
    id: row.id,
    productId: row.productId,
    sku: row.sku,
    attributes: row.attributes as Record<string, unknown>,
    stock: row.stock,
  };
}
