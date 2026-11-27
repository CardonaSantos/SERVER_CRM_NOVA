/*
 * Las filas de las gráficas son planas y con números: la UI las usa tal cual
 * como `dataset` de ECharts.
 */
import { TramoDeuda } from '../enums/tramo-deuda.enum';

/** Lo que se necesita de una factura para saber cuánto debe. */
export type SaldoFactura = {
  pagada: boolean;
  montoPago: number | null;
  saldoPendiente: number | null;
};

export type FacturaDelPeriodo = SaldoFactura & {
  /** `YYYY-MM`: el mes al que corresponde la factura. */
  mes: string;
};

export type PagoRecibido = {
  /** `YYYY-MM` en que se recibió. */
  mes: string;
  metodo: string;
  monto: number;
};

export type FacturaSinPagar = SaldoFactura & {
  clienteId: number;
  clienteDesinstalado: boolean;
  /** Fecha de negocio en que vence. */
  vence: string | null;
};

export type MesFacturacion = {
  mes: string;
  facturas: number;
  facturado: number;
  /** Cuánto de lo facturado ese mes ya está pagado. */
  pagado: number;
  pendiente: number;
  /** Dinero recibido ese mes, sea de la factura que sea. */
  cobrado: number;
  pagos: number;
};

export type FacturacionMensualReadModel = {
  periodo: { desde: string; hasta: string };
  meses: MesFacturacion[];
  totales: Omit<MesFacturacion, 'mes'>;
};

export type CobradoPorMetodoReadModel = {
  periodo: { desde: string; hasta: string };
  /** Solo los métodos con pagos en el período. */
  metodos: Array<{
    metodo: string;
    nombre: string;
    pagos: number;
    monto: number;
  }>;
  /** Una columna por cada método de `metodos`. */
  meses: Array<{ mes: string; [metodo: string]: number | string }>;
  totales: { pagos: number; monto: number };
};

export type ResumenDeuda = {
  facturas: number;
  clientes: number;
  monto: number;
};

export type DeudaAntiguedadReadModel = {
  corte: string;
  tramos: Array<ResumenDeuda & { tramo: TramoDeuda; nombre: string }>;
  totales: ResumenDeuda & { vencido: number };
  /** Deuda de clientes desinstalados: no entra en los tramos. */
  desinstalados: ResumenDeuda;
};
