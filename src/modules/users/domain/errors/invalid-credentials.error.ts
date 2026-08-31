import { DomainError } from '../../../../shared/domain/errors/domain-error';

export class InvalidCredentialsError extends DomainError {
  readonly code = 'users.invalid_credentials';
  readonly httpStatus = 401;
}
