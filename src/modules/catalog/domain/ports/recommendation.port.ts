export const CATALOG_RECOMMENDATION_PORT = Symbol('CATALOG_RECOMMENDATION_PORT');

/**
 * Lo que catalog necesita para recomendar productos relacionados. Lo
 * implementa analytics (ver analytics/index.ts). En esta fase es una
 * heurística simple (misma categoría, ordenado por product_scores) — no
 * el motor de afinidad de 4 niveles del documento original.
 */
export interface RecommendationPort {
  recommend(excludeProductId: string, categoryId: string, limit: number): Promise<{ productId: string }[]>;
}
