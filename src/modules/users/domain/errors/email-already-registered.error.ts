import { DomainError } from '../../../../shared/domain/errors/domain-error';

export class EmailAlreadyRegisteredError extends DomainError {
  readonly code = 'users.email_already_registered';
  readonly httpStatus = 409;
}
