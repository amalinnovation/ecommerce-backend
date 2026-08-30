import { Inject, Injectable } from '@nestjs/common';
import { asc } from 'drizzle-orm';
import { DB_CLIENT } from '../../../../shared/infrastructure/db/db.module';
import type { DbClient } from '../../../../shared/infrastructure/db/client';
import { categories } from '../../../../shared/infrastructure/db/schema';
import type { CategoryNode } from '../../domain/entities/category.entity';
import type { CategoryRepositoryPort } from '../../domain/ports/category-repository.port';

@Injectable()
export class DrizzleCategoryRepository implements CategoryRepositoryPort {
  constructor(@Inject(DB_CLIENT) private readonly db: DbClient) {}

  async findTree(): Promise<CategoryNode[]> {
    // Sólo hay 2 niveles por convención de aplicación (ver migración
    // 0002), así que basta con traer TODAS las categorías de una vez y
    // armar el árbol en memoria — no hace falta una CTE recursiva.
    const rows = await this.db
      .select()
      .from(categories)
      .orderBy(asc(categories.position), asc(categories.name));

    const nodes = new Map<string, CategoryNode>(
      rows.map((row) => [
        row.id,
        { id: row.id, parentId: row.parentId, name: row.name, slug: row.slug, position: row.position, children: [] },
      ]),
    );

    const roots: CategoryNode[] = [];
    for (const node of nodes.values()) {
      if (node.parentId === null) {
        roots.push(node);
        continue;
      }
      const parent = nodes.get(node.parentId);
      // Un hijo cuyo padre no está entre las raíces (3er nivel) se
      // ignora: la convención de esta fase es 2 niveles.
      if (parent && parent.parentId === null) {
        parent.children.push(node);
      }
    }
    return roots;
  }
}
