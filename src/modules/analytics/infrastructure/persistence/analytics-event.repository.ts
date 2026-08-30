import { Inject, Injectable } from '@nestjs/common';
import { DB_CLIENT } from '../../../../shared/infrastructure/db/db.module';
import type { DbClient } from '../../../../shared/infrastructure/db/client';
import { analyticsEvents } from '../../../../shared/infrastructure/db/schema';
import type { AnalyticsEvent } from '../../domain/entities/analytics-event.entity';
import type { AnalyticsEventRepositoryPort } from '../../domain/ports/analytics-event-repository.port';

@Injectable()
export class DrizzleAnalyticsEventRepository implements AnalyticsEventRepositoryPort {
  constructor(@Inject(DB_CLIENT) private readonly db: DbClient) {}

  async insertBatch(events: AnalyticsEvent[]): Promise<void> {
    await this.db.insert(analyticsEvents).values(
      events.map((event) => ({
        visitorId: event.visitorId,
        eventType: event.eventType,
        payload: event.payload,
        occurredAt: event.occurredAt.toISOString(),
      })),
    );
  }
}
