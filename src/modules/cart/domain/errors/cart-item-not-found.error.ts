import { DomainError } from '../../../../shared/domain/errors/domain-error';

/**
 * También se lanza cuando el ítem existe pero es de OTRO visitante —
 * nunca se distingue en la respuesta, para no filtrar existencia entre
 * visitantes.
 */
export class CartItemNotFoundError extends DomainError {
  readonly code = 'cart.item_not_found';
  readonly httpStatus = 404;
}
