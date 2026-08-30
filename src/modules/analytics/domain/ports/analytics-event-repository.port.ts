import type { AnalyticsEvent } from '../entities/analytics-event.entity';

export const ANALYTICS_EVENT_REPOSITORY_PORT = Symbol('ANALYTICS_EVENT_REPOSITORY_PORT');

export interface AnalyticsEventRepositoryPort {
  insertBatch(events: AnalyticsEvent[]): Promise<void>;
}
