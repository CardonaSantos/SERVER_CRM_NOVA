import Decimal from 'decimal.js';

export type CurrencyCode = 'GTQ' | 'USD';

export class Money {
  private constructor(
    private readonly amount: Decimal,
    private readonly currency: CurrencyCode = 'GTQ',
  ) {}

  static zero(currency: CurrencyCode = 'GTQ') {
    return new Money(new Decimal(0), currency);
  }

  static fromNumber(value: number, currency: CurrencyCode = 'GTQ') {
    return new Money(new Decimal(value).toDecimalPlaces(2), currency);
  }

  static fromString(value: string, currency: CurrencyCode = 'GTQ') {
    return new Money(new Decimal(value).toDecimalPlaces(2), currency);
  }

  add(other: Money): Money {
    this.ensureSameCurrency(other);

    return new Money(this.amount.plus(other.amount), this.currency);
  }

  subtract(other: Money): Money {
    this.ensureSameCurrency(other);

    return new Money(this.amount.minus(other.amount), this.currency);
  }

  isNegative(): boolean {
    return this.amount.isNegative();
  }

  toNumber(): number {
    return this.amount.toNumber();
  }

  toString(): string {
    return this.amount.toFixed(2);
  }

  isGreaterThan(other: Money): boolean {
    this.ensureSameCurrency(other);

    return this.amount > other.amount;
  }

  get currencyCode(): CurrencyCode {
    return this.currency;
  }

  private ensureSameCurrency(other: Money) {
    if (this.currency !== other.currencyCode) {
      throw new Error('No se pueden operar montos con monedas distintas.');
    }
  }
}
