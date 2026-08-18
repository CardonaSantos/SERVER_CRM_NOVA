export interface ClienteReportePeriodo {
  etiqueta: string;
  desde: Date;
  hastaExclusivo: Date;
}

export class ClienteReportePeriodosFactory {
  private static readonly GT_OFFSET_HOURS = 6;

  static mesActual(now: Date = new Date()): ClienteReportePeriodo {
    const local = this.toGuatemalaLocal(now);

    const year = local.getUTCFullYear();

    const month = local.getUTCMonth();

    const desde = this.localMidnightToUtc(year, month, 1);

    const hastaExclusivo = this.localMidnightToUtc(year, month + 1, 1);

    return {
      etiqueta: this.formatMonth(desde),

      desde,
      hastaExclusivo,
    };
  }

  static anioActual(now: Date = new Date()): ClienteReportePeriodo {
    const local = this.toGuatemalaLocal(now);

    const year = local.getUTCFullYear();

    return {
      etiqueta: `Año ${year}`,

      desde: this.localMidnightToUtc(year, 0, 1),

      hastaExclusivo: this.localMidnightToUtc(year + 1, 0, 1),
    };
  }

  static ultimosDoceMeses(now: Date = new Date()): ClienteReportePeriodo {
    const local = this.toGuatemalaLocal(now);

    const year = local.getUTCFullYear();

    const month = local.getUTCMonth();

    return {
      etiqueta: 'Últimos 12 meses',

      desde: this.localMidnightToUtc(year, month - 11, 1),

      hastaExclusivo: this.localMidnightToUtc(year, month + 1, 1),
    };
  }

  private static toGuatemalaLocal(date: Date): Date {
    return new Date(date.getTime() - this.GT_OFFSET_HOURS * 60 * 60 * 1000);
  }

  private static localMidnightToUtc(
    year: number,
    month: number,
    day: number,
  ): Date {
    return new Date(Date.UTC(year, month, day, this.GT_OFFSET_HOURS));
  }

  private static formatMonth(date: Date): string {
    return new Intl.DateTimeFormat('es-GT', {
      month: 'long',
      year: 'numeric',
      timeZone: 'America/Guatemala',
    })
      .format(date)
      .replace(/^\w/, (char) => char.toUpperCase());
  }
}
