/** Cifras de la cartera al cerrar un mes. Conteos en clientes, montos en quetzales. */
export type CifrasFotoMensual = {
  /** Clientes no eliminados. */
  totalClientes: number;
  activos: number;
  suspendidos: number;
  pendientesActivacion: number;
  enInstalacion: number;
  desinstalados: number;
  /** Cobranza, sin desinstalados. */
  alDia: number;
  pagoPendiente: number;
  atrasados: number;
  morosos: number;
  /** Deuda sin desinstalados: facturas sin pagar con saldo. */
  facturasConDeuda: number;
  clientesConDeuda: number;
  clientesConDeudaVencida: number;
  deuda: number;
  deudaVencida: number;
  /** Lo que deben los desinstalados, aparte. */
  deudaDesinstalados: number;
};

export type FotoMensualCarteraProps = CifrasFotoMensual & {
  id: number | null;
  /** `YYYY-MM` del mes que cerró. */
  mes: string;
  tomadaEn: Date;
};

export type TomarFotoMensualProps = CifrasFotoMensual & { mes: string };
