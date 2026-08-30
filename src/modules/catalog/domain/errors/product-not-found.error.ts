import { DomainError } from '../../../../shared/domain/errors/domain-error';

export class ProductNotFoundError extends DomainError {
  readonly code = 'catalog.product_not_found';
  readonly httpStatus = 404;
}
