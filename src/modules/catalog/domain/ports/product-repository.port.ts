import type { Product } from '../entities/product.entity';
import type { ProductVariant } from '../entities/product-variant.entity';

export interface ProductListItem {
  id: string;
  slug: string;
  name: string;
  categoryId: string;
  isFeatured: boolean;
  /** MIN(variant_price.price) entre variantes con available > 0; null si ninguna tiene precio vigente. */
  fromPrice: string | null;
  createdAt: Date;
}

export interface ProductListPage {
  items: ProductListItem[];
  nextCursor: string | null;
}

export interface ListProductsFilter {
  categoryId?: string;
  minPrice?: string;
  maxPrice?: string;
  cursor?: string;
  limit: number;
}

export interface SearchResultItem {
  id: string;
  slug: string;
  name: string;
  fromPrice: string | null;
  rank: number;
}

export const PRODUCT_REPOSITORY_PORT = Symbol('PRODUCT_REPOSITORY_PORT');

export interface ProductRepositoryPort {
  listActive(filter: ListProductsFilter): Promise<ProductListPage>;
  findBySlug(slug: string): Promise<{ product: Product; variants: ProductVariant[] } | null>;
  /** Búsqueda de texto completo, ordenada por ts_rank descendente. Sin cursor: sólo el top `limit`. */
  search(query: string, limit: number): Promise<SearchResultItem[]>;
  /** No garantiza preservar el orden de `ids` — quien llama reordena si le importa. */
  findManyByIds(ids: string[]): Promise<Product[]>;
}
