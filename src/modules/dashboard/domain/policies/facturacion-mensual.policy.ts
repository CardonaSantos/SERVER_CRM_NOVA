import {
  CobradoPorMetodoReadModel,
  FacturacionMensualReadModel,
  FacturaDelPeriodo,
  MesFacturacion,
  PagoRecibido,
} from '../read-models/finanzas.read-model';
import { inicioDeMes, sumarMeses } from './calendario.policy';
import { saldoDe } from './deuda.policy';
import { redondear } from './estadisticas.policy';

const NOMBRE_METODO: Record<string, string> = {
  EFECTIVO: 'Efectivo',
  TARJETA: 'Tarjeta',
  DEPOSITO: 'Depósito o transferencia',
  PAYPAL: 'PayPal',
  PENDIENTE: 'Sin definir',
  OTRO: 'Otro',
};

/** Los últimos `cantidad` meses (`YYYY-MM`), terminando en el de `hoy`. */
export function ultimosMeses(hoy: string, cantidad: number): string[] {
  const actual = inicioDeMes(hoy);

  return Array.from({ length: cantidad }, (_, i) =>
    sumarMeses(actual, i - cantidad + 1).slice(0, 7),
  );
}

export function facturacionMensual(
  hoy: string,
  meses: string[],
  facturas: FacturaDelPeriodo[],
  pagos: PagoRecibido[],
): FacturacionMensualReadModel {
  const filas = meses.map((mes): MesFacturacion => {
    const delMes = facturas.filter((f) => f.mes === mes);
    const recibidos = pagos.filter((p) => p.mes === mes);
    const facturado = suma(delMes.map((f) => f.montoPago ?? 0));
    const pendiente = suma(delMes.map(saldoDe));

    return {
      mes,
      facturas: delMes.length,
      facturado,
      pagado: redondear(facturado - pendiente),
      pendiente,
      cobrado: suma(recibidos.map((p) => p.monto)),
      pagos: recibidos.length,
    };
  });
  const total = (campo: keyof Omit<MesFacturacion, 'mes'>) =>
    suma(filas.map((f) => f[campo]));

  return {
    periodo: { desde: `${meses[0]}-01`, hasta: hoy },
    meses: filas,
    totales: {
      facturas: total('facturas'),
      facturado: total('facturado'),
      pagado: total('pagado'),
      pendiente: total('pendiente'),
      cobrado: total('cobrado'),
      pagos: total('pagos'),
    },
  };
}

export function cobradoPorMetodo(
  hoy: string,
  meses: string[],
  pagos: PagoRecibido[],
): CobradoPorMetodoReadModel {
  const delPeriodo = pagos.filter((p) => meses.includes(p.mes));
  const metodos = [...new Set(delPeriodo.map((p) => p.metodo))]
    .map((metodo) => {
      const suyos = delPeriodo.filter((p) => p.metodo === metodo);
      return {
        metodo,
        nombre: NOMBRE_METODO[metodo] ?? metodo,
        pagos: suyos.length,
        monto: suma(suyos.map((p) => p.monto)),
      };
    })
    .sort((a, b) => b.monto - a.monto || a.metodo.localeCompare(b.metodo));

  return {
    periodo: { desde: `${meses[0]}-01`, hasta: hoy },
    metodos,
    meses: meses.map((mes) => ({
      mes,
      ...Object.fromEntries(
        metodos.map(({ metodo }) => [
          metodo,
          suma(
            delPeriodo
              .filter((p) => p.mes === mes && p.metodo === metodo)
              .map((p) => p.monto),
          ),
        ]),
      ),
    })),
    totales: {
      pagos: delPeriodo.length,
      monto: suma(delPeriodo.map((p) => p.monto)),
    },
  };
}

function suma(valores: number[]): number {
  return redondear(valores.reduce((a, b) => a + b, 0));
}
