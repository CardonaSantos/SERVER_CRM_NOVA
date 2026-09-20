export class FacturacionReporteMoneyHelper {
  static toCents(value: number): number {
    if (!Number.isFinite(value)) {
      throw new Error(
        `Valor monetario inválido en builder de facturación: ${value}.`,
      );
    }

    return Math.round((value + Number.EPSILON) * 100);
  }

  static fromCents(cents: number): number {
    return cents / 100;
  }

  static sum(values: number[]): number {
    const cents = values.reduce(
      (total, value) => total + this.toCents(value),
      0,
    );

    return this.fromCents(cents);
  }

  static percentage(valueCents: number, totalCents: number): number {
    if (totalCents <= 0) {
      return 0;
    }

    return Math.round((valueCents * 10000) / totalCents) / 100;
  }

  static average(totalCents: number, count: number): number {
    if (count <= 0) {
      return 0;
    }

    return this.fromCents(Math.round(totalCents / count));
  }
}
