import { Inject, Injectable } from '@nestjs/common';

import {
  CLIENTE_REPORTE_QUERY_PORT,
  ClienteReporteQueryPort,
} from '../../../domain/ports/cliente-reportes/cliente-reporte-query.port';

import { ClienteReporteFilters } from '../../../domain/filters/clientes-query-filters';

import { ClienteReporteData } from '../../../domain/read-models/cliente-reportes/cliente-reporte-data';

import { ClienteReporteDistribucionesBuilder } from '../../builders/cliente-reporte-distribuciones.builder';
import { ClienteReportePeriodosFactory } from '../../factory/cliente-reporte-periodos.factory';

@Injectable()
export class ObtenerReporteClientesDataUseCase {
  constructor(
    @Inject(CLIENTE_REPORTE_QUERY_PORT)
    private readonly clienteReporteQuery: ClienteReporteQueryPort,
  ) {}

  async execute(filters: ClienteReporteFilters): Promise<ClienteReporteData> {
    const generadoEn = new Date();

    const mesActual = ClienteReportePeriodosFactory.mesActual(generadoEn);

    const anioActual = ClienteReportePeriodosFactory.anioActual(generadoEn);

    const ultimosDoceMeses =
      ClienteReportePeriodosFactory.ultimosDoceMeses(generadoEn);

    const [clientes, resumen, resumenMes, resumenAnio, evolucionMensual] =
      await Promise.all([
        this.clienteReporteQuery.findRows(filters),

        this.clienteReporteQuery.getResumen(filters),

        this.clienteReporteQuery.getResumenPeriodo(
          filters,
          mesActual.desde,
          mesActual.hastaExclusivo,
          mesActual.etiqueta,
        ),

        this.clienteReporteQuery.getResumenPeriodo(
          filters,
          anioActual.desde,
          anioActual.hastaExclusivo,
          anioActual.etiqueta,
        ),

        this.clienteReporteQuery.getEvolucionMensual(
          filters,
          ultimosDoceMeses.desde,
          ultimosDoceMeses.hastaExclusivo,
        ),
      ]);

    const distribuciones = ClienteReporteDistribucionesBuilder.build(clientes);

    return {
      generadoEn,

      resumen,

      mesActual: resumenMes,

      anioActual: resumenAnio,

      evolucionMensual,

      distribuciones,

      clientes,
    };
  }
}
