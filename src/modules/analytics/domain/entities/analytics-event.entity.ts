export interface AnalyticsEvent {
  visitorId: string | null;
  eventType: string;
  payload: Record<string, unknown>;
  occurredAt: Date;
}
