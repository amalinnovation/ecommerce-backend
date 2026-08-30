import { Inject, Injectable } from '@nestjs/common';
import type { CategoryNode } from '../../domain/entities/category.entity';
import { CATEGORY_REPOSITORY_PORT, type CategoryRepositoryPort } from '../../domain/ports/category-repository.port';

@Injectable()
export class ListCategoriesUseCase {
  constructor(@Inject(CATEGORY_REPOSITORY_PORT) private readonly categories: CategoryRepositoryPort) {}

  async execute(): Promise<CategoryNode[]> {
    return this.categories.findTree();
  }
}
