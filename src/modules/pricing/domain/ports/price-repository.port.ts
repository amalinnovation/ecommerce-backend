import type { PriceSnapshot } from '../entities/price.entity';

export const PRICE_REPOSITORY_PORT = Symbol('PRICE_REPOSITORY_PORT');

export interface PriceRepositoryPort {
  /** Variantes sin precio vigente quedan ausentes del Map, no en null. */
  findCurrentForVariants(variantIds: string[]): Promise<Map<string, PriceSnapshot>>;
}
