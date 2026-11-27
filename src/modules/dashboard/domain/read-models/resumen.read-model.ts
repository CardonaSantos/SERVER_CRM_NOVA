export type ClientesPorServicio = {
  activos: number;
  suspendidos: number;
  pendientesActivacion: number;
  enInstalacion: number;
  desinstalados: number;
};

export type ClientesPorCobranza = {
  alDia: number;
  pagoPendiente: number;
  atrasados: number;
  morosos: number;
};

export type FacturacionDelPeriodo = {
  facturasEmitidasMes: number;
  facturasPagadasMes: number;
  montoFacturadoMes: number;
  montoCobradoMes: number;
  montoPendienteMes: number;
};

export type DatosResumen = {
  totalEnSistema: number;
  servicio: ClientesPorServicio;
  cobranza: ClientesPorCobranza;
  facturacion: FacturacionDelPeriodo;
};

export type ResumenDashboardReadModel = {
  periodo: { desde: string; hasta: string };
  clientes: {
    resumen: { totalEnSistema: number; carteraActual: number };
    servicio: ClientesPorServicio;
    cobranza: ClientesPorCobranza;
  };
  facturacion: FacturacionDelPeriodo;
};
