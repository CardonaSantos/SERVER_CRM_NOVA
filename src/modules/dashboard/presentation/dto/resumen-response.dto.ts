export class PeriodoResponseDto {
  /** Primer día (`YYYY-MM-DD`) */
  desde: string;
  /** Último día, incluido (`YYYY-MM-DD`) */
  hasta: string;
  /** Zona horaria de las fechas */
  zonaHoraria: string;
}

export class ResumenResponseDto {
  /** Mes en curso */
  periodo: PeriodoResponseDto;
  /** Clientes vigentes */
  clientes: {
    resumen: { totalEnSistema: number; carteraActual: number };
    servicio: {
      activos: number;
      suspendidos: number;
      pendientesActivacion: number;
      enInstalacion: number;
      desinstalados: number;
    };
    cobranza: {
      alDia: number;
      pagoPendiente: number;
      atrasados: number;
      morosos: number;
    };
  };
  /** Facturación del mes, sin anuladas */
  facturacion: {
    facturasEmitidasMes: number;
    facturasPagadasMes: number;
    montoFacturadoMes: number;
    montoCobradoMes: number;
    montoPendienteMes: number;
  };
}
