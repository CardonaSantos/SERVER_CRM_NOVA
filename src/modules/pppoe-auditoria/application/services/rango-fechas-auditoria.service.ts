import { Injectable } from '@nestjs/common';

import {
  esFechaNegocioValida,
  inicioDiaNegocio,
  rangoDiasNegocio,
} from 'src/common/reloj/fecha-negocio';

import {
  FechaAuditoriaInvalidaError,
  RangoFechasAuditoriaInvalidoError,
} from '../../domain/errors/pppoe-auditoria.errors';

export type RangoFechasAuditoria = {
  fechaDesde: Date | null;
  fechaHasta: Date | null;
};

/**
 * Interpreta `fechaDesde`/`fechaHasta` de los filtros de auditoría.
 * Una fecha sin hora (`YYYY-MM-DD`) es un día completo en America/Guatemala
 * (estándar §7.6); una fecha con hora se usa tal cual.
 */
@Injectable()
export class RangoFechasAuditoriaService {
  interpretar(
    desde?: string | null,
    hasta?: string | null,
  ): RangoFechasAuditoria {
    const fechaDesde = this.leer(desde, 'fechaDesde', 'inicio');
    const fechaHasta = this.leer(hasta, 'fechaHasta', 'fin');

    if (fechaDesde && fechaHasta && fechaDesde > fechaHasta) {
      throw new RangoFechasAuditoriaInvalidoError();
    }

    return { fechaDesde, fechaHasta };
  }

  private leer(
    valor: string | null | undefined,
    campo: 'fechaDesde' | 'fechaHasta',
    extremo: 'inicio' | 'fin',
  ): Date | null {
    const texto = valor?.trim();

    if (!texto) return null;

    if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
      if (!esFechaNegocioValida(texto))
        throw new FechaAuditoriaInvalidaError(campo);

      return extremo === 'inicio'
        ? inicioDiaNegocio(texto)
        : new Date(rangoDiasNegocio(null, texto).lt!.getTime() - 1);
    }

    const fecha = new Date(texto);

    if (Number.isNaN(fecha.getTime()))
      throw new FechaAuditoriaInvalidaError(campo);

    return fecha;
  }
}
