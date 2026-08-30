export class ProductSummaryDto {
  id!: string;
  slug!: string;
  name!: string;
  categoryId!: string;
  isFeatured!: boolean;
  fromPrice!: string | null;
}

/** Sólo lo que product.repository.ts realmente selecciona en la búsqueda. */
export class SearchResultDto {
  id!: string;
  slug!: string;
  name!: string;
  fromPrice!: string | null;
  rank!: number;
}

export class PagedProductsDto {
  items!: ProductSummaryDto[];
  nextCursor!: string | null;
}

/**
 * Sin fromPrice a propósito: la heurística de recomendaciones de esta
 * fase (misma categoría + product_scores) no lo calcula. Ponerlo en null
 * se confundiría con "sin precio vigente".
 */
export class RecommendedProductDto {
  id!: string;
  slug!: string;
  name!: string;
  categoryId!: string;
  isFeatured!: boolean;
}
