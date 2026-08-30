import { Inject, Injectable } from '@nestjs/common';
import {
  ANALYTICS_EVENT_REPOSITORY_PORT,
  type AnalyticsEventRepositoryPort,
} from '../../domain/ports/analytics-event-repository.port';
import { InvalidEventBatchError } from '../../domain/errors/invalid-event-batch.error';

export interface IngestEventInput {
  eventType: string;
  payload?: Record<string, unknown>;
  occurredAt?: Date;
}

@Injectable()
export class IngestEventsUseCase {
  constructor(
    @Inject(ANALYTICS_EVENT_REPOSITORY_PORT) private readonly events: AnalyticsEventRepositoryPort,
  ) {}

  /**
   * El DTO ya valida tamaño de lote (1-50), pero se revalida acá como
   * defensa en profundidad — el caso de uso no debe confiar en que todo
   * caller pase por el mismo DTO.
   */
  async execute(visitorId: string | null, batch: IngestEventInput[]): Promise<void> {
    if (batch.length === 0) {
      throw new InvalidEventBatchError('El lote de eventos no puede estar vacío');
    }

    const receivedAt = new Date();
    await this.events.insertBatch(
      batch.map((event) => ({
        visitorId,
        eventType: event.eventType,
        payload: event.payload ?? {},
        occurredAt: event.occurredAt ?? receivedAt,
      })),
    );
  }
}
