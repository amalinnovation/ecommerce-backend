import { describe, expect, it, vi } from 'vitest';
import type { Cart } from '../../domain/entities/cart.entity';
import type { CartItem } from '../../domain/entities/cart-item.entity';
import type { CartRepositoryPort } from '../../domain/ports/cart-repository.port';
import type { CartLinePriceQuote, PriceQuoterPort } from '../../domain/ports/price-quoter.port';
import { VariantOutOfStockError } from '../../domain/errors/variant-out-of-stock.error';
import { VariantPriceUnavailableError } from '../../domain/errors/variant-price-unavailable.error';
import { BuildCartSnapshotService } from '../services/build-cart-snapshot.service';
import { AddCartItemUseCase } from './add-cart-item.use-case';

const CART: Cart = { id: 'cart-1', visitorId: 'visitor-1', status: 'active' };

class FakeCartRepository implements CartRepositoryPort {
  items: CartItem[] = [];
  findOrCreateActiveForVisitor(): Promise<{ cart: Cart; items: CartItem[] }> {
    return Promise.resolve({ cart: CART, items: this.items });
  }
  addItem(cartId: string, variantId: string, quantity: number): Promise<CartItem> {
    const existing = this.items.find((i) => i.variantId === variantId);
    if (existing) {
      existing.quantity += quantity;
      return Promise.resolve(existing);
    }
    const item: CartItem = { id: `item-${this.items.length + 1}`, cartId, variantId, quantity };
    this.items.push(item);
    return Promise.resolve(item);
  }
  setItemQuantity(): Promise<CartItem> {
    throw new Error('no usado en esta prueba');
  }
  removeItem(): Promise<void> {
    throw new Error('no usado en esta prueba');
  }
  findItemForVisitor(): Promise<CartItem | null> {
    throw new Error('no usado en esta prueba');
  }
  findItems(): Promise<CartItem[]> {
    return Promise.resolve(this.items);
  }
}

class FakePriceQuoter implements PriceQuoterPort {
  constructor(private readonly quotes: Map<string, CartLinePriceQuote>) {}
  quoteMany(variantIds: string[]): Promise<Map<string, CartLinePriceQuote>> {
    const result = new Map<string, CartLinePriceQuote>();
    for (const id of variantIds) {
      const quote = this.quotes.get(id);
      if (quote) result.set(id, quote);
    }
    return Promise.resolve(result);
  }
}

function buildUseCase(quotes: Map<string, CartLinePriceQuote>, repo = new FakeCartRepository()) {
  const priceQuoter = new FakePriceQuoter(quotes);
  const snapshotService = new BuildCartSnapshotService(priceQuoter);
  return { useCase: new AddCartItemUseCase(repo, priceQuoter, snapshotService), repo };
}

describe('AddCartItemUseCase', () => {
  it('sin stock suficiente lanza VariantOutOfStockError y no escribe nada', async () => {
    const { useCase, repo } = buildUseCase(
      new Map([['variant-1', { variantId: 'variant-1', unitPrice: '10.00', available: 1 }]]),
    );
    const addItemSpy = vi.spyOn(repo, 'addItem');

    await expect(useCase.execute('visitor-1', 'variant-1', 3)).rejects.toThrow(VariantOutOfStockError);
    expect(addItemSpy).not.toHaveBeenCalled();
  });

  it('sin precio vigente lanza VariantPriceUnavailableError', async () => {
    const { useCase } = buildUseCase(new Map());
    await expect(useCase.execute('visitor-1', 'variant-inexistente', 1)).rejects.toThrow(
      VariantPriceUnavailableError,
    );
  });

  it('agregar la misma variante dos veces suma la cantidad, no duplica la línea', async () => {
    const { useCase, repo } = buildUseCase(
      new Map([['variant-1', { variantId: 'variant-1', unitPrice: '10.00', available: 10 }]]),
    );

    await useCase.execute('visitor-1', 'variant-1', 2);
    const snapshot = await useCase.execute('visitor-1', 'variant-1', 3);

    expect(repo.items).toHaveLength(1);
    expect(snapshot.lines).toHaveLength(1);
    expect(snapshot.lines[0].quantity).toBe(5);
    // El precio de la línea viene del PriceQuoterPort, nunca inventado.
    expect(snapshot.lines[0].unitPrice).toBe('10.00');
  });
});
