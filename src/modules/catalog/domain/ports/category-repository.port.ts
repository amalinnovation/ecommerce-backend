import type { CategoryNode } from '../entities/category.entity';

export const CATEGORY_REPOSITORY_PORT = Symbol('CATEGORY_REPOSITORY_PORT');

export interface CategoryRepositoryPort {
  /** Árbol de 2 niveles: raíces (parent_id null) con sus hijos directos. */
  findTree(): Promise<CategoryNode[]>;
}
