import {
  EstadoCliente,
  EstadoCobranzaCliente,
  FacturacionZona,
  Prisma,
  StateFacturaInternet,
} from '@prisma/client';
import { dayjs } from 'src/Utils/dayjs.config';

export const TZ_FACTURACION = 'America/Guatemala';

export const ESTADOS_FACTURA_PENDIENTE: StateFacturaInternet[] = [
  StateFacturaInternet.PENDIENTE,
  StateFacturaInternet.PARCIAL,
  StateFacturaInternet.VENCIDA,
];

export const CLIENTE_FACTURABLE_WHERE: Prisma.ClienteInternetWhereInput = {
  isEliminado: false,
  desinstaladoEn: null,
  estadoCliente: EstadoCliente.ACTIVO,
  servicioInternetId: {
    not: null,
  },
};

export const shouldSkipZoneToday = (dia?: number | null): boolean => {
  if (!dia) return true;

  const todayGT = dayjs().tz(TZ_FACTURACION).date();

  return dia !== todayGT;
};

export function calcularPeriodo(
  zona: Pick<FacturacionZona, 'diaPago'>,
  hoy = dayjs().tz(TZ_FACTURACION),
): string {
  const diaPagoDeseado = zona.diaPago;
  const ultimoDiaMes = hoy.daysInMonth();
  const diaValido = Math.min(diaPagoDeseado, ultimoDiaMes);

  const base = hoy.date(diaValido).startOf('day');

  const fechaReferencia = base.isBefore(hoy, 'day')
    ? base.add(1, 'month')
    : base;

  return fechaReferencia.format('YYYYMM');
}

export function calcularFechaPagoEsperada(
  zona: Pick<FacturacionZona, 'diaPago'>,
  periodo: string,
): Date {
  const basePeriodo = dayjs.tz(periodo, 'YYYYMM', TZ_FACTURACION);
  const ultimoDiaMes = basePeriodo.daysInMonth();
  const diaValido = Math.min(zona.diaPago, ultimoDiaMes);

  return basePeriodo.date(diaValido).startOf('day').toDate();
}

export const getEstadoCobranza = (
  pendientes: number,
): EstadoCobranzaCliente => {
  if (pendientes <= 0) return EstadoCobranzaCliente.AL_DIA;
  if (pendientes === 1) return EstadoCobranzaCliente.PAGO_PENDIENTE;
  if (pendientes === 2) return EstadoCobranzaCliente.ATRASADO;

  return EstadoCobranzaCliente.MOROSO;
};
