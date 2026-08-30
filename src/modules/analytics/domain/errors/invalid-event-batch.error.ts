import { DomainError } from '../../../../shared/domain/errors/domain-error';

export class InvalidEventBatchError extends DomainError {
  readonly code = 'analytics.invalid_event_batch';
  readonly httpStatus = 400;
}
