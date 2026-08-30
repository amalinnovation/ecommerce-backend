import { describe, expect, it } from 'vitest';
import { Money } from './money';

describe('Money', () => {
  it('suma dos montos sin error de punto flotante', () => {
    const total = Money.fromDecimalString('10.10').add(Money.fromDecimalString('0.20'));
    expect(total.toDecimalString()).toBe('10.30');
  });

  it('redondea a 2 decimales al multiplicar por cantidad', () => {
    // 3.333 -> 333.3 centavos -> redondea a 333 -> ×3 = 999 centavos
    const total = Money.fromDecimalString('3.333').multiply(3);
    expect(total.toDecimalString()).toBe('9.99');
  });

  it('zero() es el elemento neutro de la suma', () => {
    const money = Money.fromDecimalString('42.50');
    expect(Money.zero().add(money).toDecimalString()).toBe(money.toDecimalString());
  });

  it('rechaza un string no numérico', () => {
    expect(() => Money.fromDecimalString('no-es-un-numero')).toThrow();
  });
});
