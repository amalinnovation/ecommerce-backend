import { describe, expect, it } from 'vitest';
import type { Cart } from '../../domain/entities/cart.entity';
import type { CartItem } from '../../domain/entities/cart-item.entity';
import type { CartRepositoryPort } from '../../domain/ports/cart-repository.port';
import type { CartLinePriceQuote, PriceQuoterPort } from '../../domain/ports/price-quoter.port';
import { CartItemNotFoundError } from '../../domain/errors/cart-item-not-found.error';
import { BuildCartSnapshotService } from '../services/build-cart-snapshot.service';
import { UpdateCartItemUseCase } from './update-cart-item.use-case';

const CART: Cart = { id: 'cart-1', visitorId: 'visitor-1', status: 'active' };
const ITEM: CartItem = { id: 'item-1', cartId: 'cart-1', variantId: 'variant-1', quantity: 1 };

class FakeCartRepository implements CartRepositoryPort {
  // Simula que el ítem existe, pero pertenece a OTRO visitante que no es
  // 'visitor-1' — findItemForVisitor debe devolver null igual que si no
  // existiera, sin distinguir el motivo en la respuesta.
  findOrCreateActiveForVisitor(): Promise<{ cart: Cart; items: CartItem[] }> {
    return Promise.resolve({ cart: CART, items: [ITEM] });
  }
  addItem(): Promise<CartItem> {
    throw new Error('no usado en esta prueba');
  }
  setItemQuantity(): Promise<CartItem> {
    throw new Error('no debería llamarse si el ítem es de otro visitante');
  }
  removeItem(): Promise<void> {
    throw new Error('no usado en esta prueba');
  }
  findItemForVisitor(cartItemId: string, visitorId: string): Promise<CartItem | null> {
    if (cartItemId === ITEM.id && visitorId === 'visitor-1') return Promise.resolve(ITEM);
    return Promise.resolve(null);
  }
  findItems(): Promise<CartItem[]> {
    return Promise.resolve([ITEM]);
  }
}

class FakePriceQuoter implements PriceQuoterPort {
  quoteMany(variantIds: string[]): Promise<Map<string, CartLinePriceQuote>> {
    const result = new Map<string, CartLinePriceQuote>();
    for (const id of variantIds) result.set(id, { variantId: id, unitPrice: '10.00', available: 10 });
    return Promise.resolve(result);
  }
}

describe('UpdateCartItemUseCase', () => {
  it('un ítem de otro visitante da CartItemNotFoundError, igual que uno inexistente', async () => {
    const repo = new FakeCartRepository();
    const priceQuoter = new FakePriceQuoter();
    const useCase = new UpdateCartItemUseCase(repo, priceQuoter, new BuildCartSnapshotService(priceQuoter));

    await expect(useCase.execute('otro-visitante', ITEM.id, 2)).rejects.toThrow(CartItemNotFoundError);
    await expect(useCase.execute('visitor-1', 'item-que-no-existe', 2)).rejects.toThrow(CartItemNotFoundError);
  });
});
