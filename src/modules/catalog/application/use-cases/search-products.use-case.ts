import { Inject, Injectable } from '@nestjs/common';
import {
  PRODUCT_REPOSITORY_PORT,
  type ProductRepositoryPort,
  type SearchResultItem,
} from '../../domain/ports/product-repository.port';

@Injectable()
export class SearchProductsUseCase {
  constructor(@Inject(PRODUCT_REPOSITORY_PORT) private readonly products: ProductRepositoryPort) {}

  async execute(query: string, limit: number): Promise<SearchResultItem[]> {
    return this.products.search(query, limit);
  }
}
