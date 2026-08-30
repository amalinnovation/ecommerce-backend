import { Inject, Injectable } from '@nestjs/common';
import type { Visitor } from '../../domain/entities/visitor.entity';
import { VISITOR_REPOSITORY_PORT, type VisitorRepositoryPort } from '../../domain/ports/visitor-repository.port';

@Injectable()
export class GetOrCreateVisitorUseCase {
  constructor(
    @Inject(VISITOR_REPOSITORY_PORT) private readonly visitors: VisitorRepositoryPort,
  ) {}

  /**
   * Si `existingId` viene y sigue existiendo, lo reutiliza y actualiza
   * `last_seen_at`. Si no viene, o la cookie apunta a un visitante que ya
   * no existe (secreto rotado, purga), crea uno nuevo.
   */
  async execute(existingId?: string): Promise<Visitor> {
    if (existingId) {
      const visitor = await this.visitors.findById(existingId);
      if (visitor) {
        await this.visitors.touch(existingId);
        return visitor;
      }
    }
    return this.visitors.create();
  }
}
