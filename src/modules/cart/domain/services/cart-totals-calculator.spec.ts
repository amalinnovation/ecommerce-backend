import { describe, expect, it } from 'vitest';
import { calculateCartTotals } from './cart-totals-calculator';

describe('calculateCartTotals', () => {
  it('un carrito vacío tiene subtotal 0', () => {
    const result = calculateCartTotals([], new Map());
    expect(result.lines).toEqual([]);
    expect(result.subtotal).toBe('0.00');
  });

  it('suma las líneas con precio vigente', () => {
    const result = calculateCartTotals(
      [
        { id: 'item-1', variantId: 'variant-1', quantity: 2 },
        { id: 'item-2', variantId: 'variant-2', quantity: 1 },
      ],
      new Map([
        ['variant-1', { unitPrice: '10.00' }],
        ['variant-2', { unitPrice: '5.50' }],
      ]),
    );
    expect(result.subtotal).toBe('25.50');
    expect(result.lines[0]).toMatchObject({ lineTotal: '20.00', priceUnavailable: false });
  });

  it('una línea sin precio vigente se marca priceUnavailable y NO entra al subtotal', () => {
    const result = calculateCartTotals(
      [{ id: 'item-1', variantId: 'variant-discontinuado', quantity: 3 }],
      new Map(),
    );
    expect(result.subtotal).toBe('0.00');
    expect(result.lines[0]).toMatchObject({
      priceUnavailable: true,
      unitPrice: null,
      lineTotal: null,
    });
  });

  it('mezcla líneas disponibles y no disponibles: sólo las disponibles suman', () => {
    const result = calculateCartTotals(
      [
        { id: 'item-1', variantId: 'variant-ok', quantity: 1 },
        { id: 'item-2', variantId: 'variant-descontinuada', quantity: 5 },
      ],
      new Map([['variant-ok', { unitPrice: '12.34' }]]),
    );
    expect(result.subtotal).toBe('12.34');
    expect(result.lines).toHaveLength(2);
  });
});
