import type { Visitor } from '../entities/visitor.entity';

export const VISITOR_REPOSITORY_PORT = Symbol('VISITOR_REPOSITORY_PORT');

export interface VisitorRepositoryPort {
  findById(id: string): Promise<Visitor | null>;
  create(): Promise<Visitor>;
  touch(id: string): Promise<void>;
}
