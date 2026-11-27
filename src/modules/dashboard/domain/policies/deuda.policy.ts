import { TramoDeuda } from '../enums/tramo-deuda.enum';
import {
  DeudaAntiguedadReadModel,
  FacturaSinPagar,
  ResumenDeuda,
  SaldoFactura,
} from '../read-models/finanzas.read-model';
import { diasEntre } from './calendario.policy';
import { redondear } from './estadisticas.policy';

const NOMBRE_TRAMO: Record<TramoDeuda, string> = {
  [TramoDeuda.POR_VENCER]: 'Por vencer',
  [TramoDeuda.DE_1_A_30]: '1 a 30 días',
  [TramoDeuda.DE_31_A_60]: '31 a 60 días',
  [TramoDeuda.DE_61_A_90]: '61 a 90 días',
  [TramoDeuda.MAS_DE_90]: 'Más de 90 días',
  [TramoDeuda.SIN_FECHA]: 'Sin fecha de vencimiento',
};

/** Sin saldo guardado, una factura sin pagar debe su monto completo. */
export function saldoDe(factura: SaldoFactura): number {
  if (factura.pagada) return 0;

  return factura.saldoPendiente ?? factura.montoPago ?? 0;
}

/** Vence hoy todavía es "por vencer". */
export function tramoDe(vence: string | null, hoy: string): TramoDeuda {
  if (!vence) return TramoDeuda.SIN_FECHA;

  const dias = diasEntre(vence, hoy);

  if (dias <= 0) return TramoDeuda.POR_VENCER;
  if (dias <= 30) return TramoDeuda.DE_1_A_30;
  if (dias <= 60) return TramoDeuda.DE_31_A_60;
  if (dias <= 90) return TramoDeuda.DE_61_A_90;
  return TramoDeuda.MAS_DE_90;
}

export function esVencida(vence: string | null, hoy: string): boolean {
  return vence !== null && vence < hoy;
}

export function deudaPorAntiguedad(
  facturas: FacturaSinPagar[],
  hoy: string,
): DeudaAntiguedadReadModel {
  // Una factura sin pagar de Q0 no es deuda: no cuenta facturas ni clientes.
  const conSaldo = facturas.filter((f) => saldoDe(f) > 0);
  const vigentes = conSaldo.filter((f) => !f.clienteDesinstalado);
  const porTramo = new Map<TramoDeuda, FacturaSinPagar[]>();

  for (const factura of vigentes) {
    const tramo = tramoDe(factura.vence, hoy);
    porTramo.set(tramo, [...(porTramo.get(tramo) ?? []), factura]);
  }

  // Los tramos salen siempre, aunque estén en cero; "sin fecha" solo si hay.
  const tramos = Object.values(TramoDeuda)
    .filter((t) => t !== TramoDeuda.SIN_FECHA || porTramo.has(t))
    .map((tramo) => ({
      tramo,
      nombre: NOMBRE_TRAMO[tramo],
      ...resumir(porTramo.get(tramo) ?? []),
    }));

  return {
    corte: hoy,
    tramos,
    totales: {
      ...resumir(vigentes),
      vencido: resumir(vigentes.filter((f) => esVencida(f.vence, hoy))).monto,
    },
    desinstalados: resumir(conSaldo.filter((f) => f.clienteDesinstalado)),
  };
}

function resumir(facturas: FacturaSinPagar[]): ResumenDeuda {
  return {
    facturas: facturas.length,
    clientes: new Set(facturas.map((f) => f.clienteId)).size,
    monto: redondear(facturas.reduce((total, f) => total + saldoDe(f), 0)),
  };
}
