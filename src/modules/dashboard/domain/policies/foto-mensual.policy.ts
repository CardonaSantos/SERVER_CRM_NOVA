import {
  EvolucionCarteraReadModel,
  FotoMensualCarteraReadModel,
  MesEvolucionCartera,
} from '../read-models/evolucion-cartera.read-model';
import { DatosResumen } from '../read-models/resumen.read-model';
import { FacturaSinPagar } from '../read-models/finanzas.read-model';
import { TomarFotoMensualProps } from '../props/foto-mensual-cartera.props';
import { inicioDeMes, sumarDias, sumarMeses } from './calendario.policy';
import { deudaPorAntiguedad, esVencida, saldoDe } from './deuda.policy';

/** El mes que cierra cuando la fecha de negocio es `hoy` (el anterior). */
export function mesQueCierra(hoy: string): string {
  return sumarMeses(inicioDeMes(hoy), -1).slice(0, 7);
}

/**
 * Cifras de la foto con las mismas reglas del panel: cobranza sin
 * desinstalados y deuda como en la antigüedad de la deuda (con saldo, sin
 * desinstalados; vencida si su fecha de vencimiento ya pasó).
 */
export function cifrasFotoMensual(
  mes: string,
  clientes: Pick<DatosResumen, 'totalEnSistema' | 'servicio' | 'cobranza'>,
  facturas: FacturaSinPagar[],
  hoy: string,
): TomarFotoMensualProps {
  const deuda = deudaPorAntiguedad(facturas, hoy);
  const vencidas = facturas.filter(
    (f) => !f.clienteDesinstalado && saldoDe(f) > 0 && esVencida(f.vence, hoy),
  );

  return {
    mes,
    totalClientes: clientes.totalEnSistema,
    activos: clientes.servicio.activos,
    suspendidos: clientes.servicio.suspendidos,
    pendientesActivacion: clientes.servicio.pendientesActivacion,
    enInstalacion: clientes.servicio.enInstalacion,
    desinstalados: clientes.servicio.desinstalados,
    alDia: clientes.cobranza.alDia,
    pagoPendiente: clientes.cobranza.pagoPendiente,
    atrasados: clientes.cobranza.atrasados,
    morosos: clientes.cobranza.morosos,
    facturasConDeuda: deuda.totales.facturas,
    clientesConDeuda: deuda.totales.clientes,
    clientesConDeudaVencida: new Set(vencidas.map((f) => f.clienteId)).size,
    deuda: deuda.totales.monto,
    deudaVencida: deuda.totales.vencido,
    deudaDesinstalados: deuda.desinstalados.monto,
  };
}

/** Los últimos `cantidad` meses ya cerrados (sin el actual), del más viejo al más nuevo. */
export function mesesCerrados(hoy: string, cantidad: number): string[] {
  const ultimo = `${mesQueCierra(hoy)}-01`;
  return Array.from({ length: cantidad }, (_, i) =>
    sumarMeses(ultimo, i - cantidad + 1).slice(0, 7),
  );
}

/** Una fila por mes; los meses sin foto quedan con sus cifras en `null`. */
export function evolucionCartera(
  meses: string[],
  fotos: FotoMensualCarteraReadModel[],
): EvolucionCarteraReadModel {
  const porMes = new Map(fotos.map((f) => [f.mes, f]));
  const ultimo = meses[meses.length - 1];

  return {
    periodo: {
      desde: `${meses[0]}-01`,
      hasta: sumarDias(sumarMeses(`${ultimo}-01`, 1), -1),
    },
    meses: meses.map((mes) => {
      const foto = porMes.get(mes);
      return foto ? { ...foto } : sinFoto(mes);
    }),
  };
}

function sinFoto(mes: string): MesEvolucionCartera {
  return {
    mes,
    tomadaEn: null,
    totalClientes: null,
    activos: null,
    suspendidos: null,
    pendientesActivacion: null,
    enInstalacion: null,
    desinstalados: null,
    alDia: null,
    pagoPendiente: null,
    atrasados: null,
    morosos: null,
    facturasConDeuda: null,
    clientesConDeuda: null,
    clientesConDeudaVencida: null,
    deuda: null,
    deudaVencida: null,
    deudaDesinstalados: null,
  };
}
