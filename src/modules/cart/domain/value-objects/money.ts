/**
 * Duplicado deliberado de pricing/domain/value-objects/money.ts —
 * importar el domain/ de otro módulo no es ninguna de las dos formas de
 * comunicación permitidas (sección 04 del documento de arquitectura).
 */
export class Money {
  private constructor(private readonly cents: number) {}

  static fromDecimalString(value: string): Money {
    const cents = Math.round(Number.parseFloat(value) * 100);
    if (!Number.isFinite(cents)) {
      throw new Error(`Money.fromDecimalString: valor inválido "${value}"`);
    }
    return new Money(cents);
  }

  static zero(): Money {
    return new Money(0);
  }

  add(other: Money): Money {
    return new Money(this.cents + other.cents);
  }

  multiply(quantity: number): Money {
    return new Money(Math.round(this.cents * quantity));
  }

  toDecimalString(): string {
    return (this.cents / 100).toFixed(2);
  }

  get centsValue(): number {
    return this.cents;
  }
}
