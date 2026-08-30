import { describe, expect, it, vi } from 'vitest';
import type { AnalyticsEvent } from '../../domain/entities/analytics-event.entity';
import type { AnalyticsEventRepositoryPort } from '../../domain/ports/analytics-event-repository.port';
import { InvalidEventBatchError } from '../../domain/errors/invalid-event-batch.error';
import { IngestEventsUseCase } from './ingest-events.use-case';

class FakeAnalyticsEventRepository implements AnalyticsEventRepositoryPort {
  inserted: AnalyticsEvent[] = [];
  insertBatch(events: AnalyticsEvent[]): Promise<void> {
    this.inserted.push(...events);
    return Promise.resolve();
  }
}

describe('IngestEventsUseCase', () => {
  it('rechaza un lote vacío sin tocar el repositorio', async () => {
    const repo = new FakeAnalyticsEventRepository();
    const insertBatchSpy = vi.spyOn(repo, 'insertBatch');
    const useCase = new IngestEventsUseCase(repo);

    await expect(useCase.execute('visitor-1', [])).rejects.toThrow(InvalidEventBatchError);
    expect(insertBatchSpy).not.toHaveBeenCalled();
  });

  it('inserta el lote completo con el visitorId y un occurredAt por defecto', async () => {
    const repo = new FakeAnalyticsEventRepository();
    const useCase = new IngestEventsUseCase(repo);

    await useCase.execute('visitor-1', [{ eventType: 'product.viewed' }, { eventType: 'search.performed' }]);

    expect(repo.inserted).toHaveLength(2);
    expect(repo.inserted.every((e) => e.visitorId === 'visitor-1')).toBe(true);
    expect(repo.inserted.every((e) => e.occurredAt instanceof Date)).toBe(true);
  });
});
