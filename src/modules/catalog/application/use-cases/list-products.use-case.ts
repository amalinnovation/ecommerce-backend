import { Inject, Injectable } from '@nestjs/common';
import {
  PRODUCT_REPOSITORY_PORT,
  type ListProductsFilter,
  type ProductListPage,
  type ProductRepositoryPort,
} from '../../domain/ports/product-repository.port';

@Injectable()
export class ListProductsUseCase {
  constructor(@Inject(PRODUCT_REPOSITORY_PORT) private readonly products: ProductRepositoryPort) {}

  async execute(filter: ListProductsFilter): Promise<ProductListPage> {
    return this.products.listActive(filter);
  }
}
