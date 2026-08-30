import { DomainError } from '../../../../shared/domain/errors/domain-error';

export class VariantPriceUnavailableError extends DomainError {
  readonly code = 'cart.variant_price_unavailable';
  readonly httpStatus = 409;
}
