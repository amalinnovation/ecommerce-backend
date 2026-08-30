import { DomainError } from '../../../../shared/domain/errors/domain-error';

export class VariantOutOfStockError extends DomainError {
  readonly code = 'cart.variant_out_of_stock';
  readonly httpStatus = 409;
}
