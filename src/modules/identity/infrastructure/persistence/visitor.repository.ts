import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DB_CLIENT } from '../../../../shared/infrastructure/db/db.module';
import type { DbClient } from '../../../../shared/infrastructure/db/client';
import { visitors } from '../../../../shared/infrastructure/db/schema';
import type { Visitor } from '../../domain/entities/visitor.entity';
import type { VisitorRepositoryPort } from '../../domain/ports/visitor-repository.port';

@Injectable()
export class DrizzleVisitorRepository implements VisitorRepositoryPort {
  constructor(@Inject(DB_CLIENT) private readonly db: DbClient) {}

  async findById(id: string): Promise<Visitor | null> {
    const [row] = await this.db.select().from(visitors).where(eq(visitors.id, id)).limit(1);
    return row ? toDomain(row) : null;
  }

  async create(): Promise<Visitor> {
    const [row] = await this.db.insert(visitors).values({}).returning();
    return toDomain(row);
  }

  async touch(id: string): Promise<void> {
    await this.db.update(visitors).set({ lastSeenAt: new Date().toISOString() }).where(eq(visitors.id, id));
  }
}

function toDomain(row: typeof visitors.$inferSelect): Visitor {
  return {
    id: row.id,
    createdAt: new Date(row.createdAt),
    lastSeenAt: new Date(row.lastSeenAt),
  };
}
