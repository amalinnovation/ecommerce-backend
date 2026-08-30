export const PRODUCT_SCORE_REPOSITORY_PORT = Symbol('PRODUCT_SCORE_REPOSITORY_PORT');

export interface ProductScoreRepositoryPort {
  /** Misma categoría, excluye el producto dado, status='active', order by score desc. */
  findTopByCategory(
    categoryId: string,
    excludeProductId: string,
    limit: number,
  ): Promise<{ productId: string }[]>;
}
