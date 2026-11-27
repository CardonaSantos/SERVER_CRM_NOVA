import { PrioridadTicket } from '../../../ticket-soporte/public/ticket-soporte.types';
import { Granularidad } from '../enums/granularidad.enum';
import { PresetActividad } from '../enums/preset-actividad.enum';
import { DashboardRangoInvalidoError } from '../errors/dashboard.errors';
import {
  ActividadTicketsReadModel,
  ConteoPorPrioridad,
  PuntoActividadTickets,
  TicketCreado,
  TicketPendiente,
  TicketResuelto,
} from '../read-models/actividad-tickets.read-model';
import {
  diasEntre,
  inicioDeMes,
  partes,
  RangoFechas,
  sumarDias,
  sumarMeses,
} from './calendario.policy';
import {
  minutosEntre,
  promedio,
  soloNumeros,
  variacionPorcentaje,
} from './estadisticas.policy';

export type RangoActividad = RangoFechas & {
  preset: PresetActividad;
  granularidad: Granularidad;
  /** `null` cuando no hay un período anterior comparable. */
  comparacion: RangoFechas | null;
};

export type PedidoRango = {
  preset: PresetActividad;
  desde?: string;
  hasta?: string;
  hoy: string;
  /** Solo para el histórico. */
  primerTicket: string | null;
};

export function resolverRango(pedido: PedidoRango): RangoActividad {
  const { preset, hoy } = pedido;
  const manana = sumarDias(hoy, 1);

  const desde = inicioDelRango(pedido);
  const hastaExclusivo =
    preset === PresetActividad.PERSONALIZADO
      ? sumarDias(pedido.hasta!, 1)
      : manana;

  return {
    preset,
    desde,
    hastaExclusivo,
    granularidad: granularidadDe(preset, desde, hastaExclusivo),
    comparacion: comparacionDe(preset, desde, hastaExclusivo),
  };
}

function inicioDelRango(pedido: PedidoRango): string {
  const { preset, hoy } = pedido;

  switch (preset) {
    case PresetActividad.ULTIMOS_7_DIAS:
      return sumarDias(hoy, -6);
    case PresetActividad.ULTIMOS_30_DIAS:
      return sumarDias(hoy, -29);
    case PresetActividad.ULTIMOS_12_MESES:
      return sumarMeses(inicioDeMes(hoy), -11);
    case PresetActividad.HISTORICO:
      return pedido.primerTicket ?? hoy;
    case PresetActividad.PERSONALIZADO:
      return exigirDesde(pedido);
  }
}

function exigirDesde({ desde, hasta, hoy }: PedidoRango): string {
  if (!desde || !hasta) {
    throw new DashboardRangoInvalidoError(
      'Un rango personalizado necesita las fechas desde y hasta.',
    );
  }
  if (desde > hasta) {
    throw new DashboardRangoInvalidoError(
      'La fecha desde no puede ser posterior a hasta.',
    );
  }
  if (hasta > hoy) {
    throw new DashboardRangoInvalidoError(
      'La fecha hasta no puede ser posterior a hoy.',
    );
  }
  return desde;
}

function granularidadDe(
  preset: PresetActividad,
  desde: string,
  hastaExclusivo: string,
): Granularidad {
  if (preset === PresetActividad.ULTIMOS_12_MESES) return Granularidad.MES;

  const dias = diasEntre(desde, hastaExclusivo);

  if (dias <= 45) return Granularidad.DIA;
  if (dias <= 730) return Granularidad.MES;
  if (dias <= 1825) return Granularidad.TRIMESTRE;
  return Granularidad.ANIO;
}

function comparacionDe(
  preset: PresetActividad,
  desde: string,
  hastaExclusivo: string,
): RangoFechas | null {
  if (preset === PresetActividad.HISTORICO) return null;

  if (preset === PresetActividad.ULTIMOS_12_MESES) {
    return {
      desde: sumarMeses(desde, -12),
      hastaExclusivo: sumarMeses(hastaExclusivo, -12),
    };
  }

  const dias = diasEntre(desde, hastaExclusivo);
  return { desde: sumarDias(desde, -dias), hastaExclusivo: desde };
}

export type DatosActividad = {
  /** Incluyen el período de comparación, si lo hay. */
  creados: TicketCreado[];
  resueltos: TicketResuelto[];
  pendientes: TicketPendiente[];
};

export function armarActividad(
  rango: RangoActividad,
  datos: DatosActividad,
  hace48Horas: Date,
): ActividadTicketsReadModel {
  const dentro = (r: RangoFechas) => (t: { fecha: string }) =>
    t.fecha >= r.desde && t.fecha < r.hastaExclusivo;

  const creados = datos.creados.filter(dentro(rango));
  const resueltos = datos.resueltos.filter(dentro(rango));
  const pendientes = contarPrioridades(datos.pendientes);
  const actividad = serie(rango, creados, resueltos);
  const { comparacion } = rango;

  return {
    periodo: {
      preset: rango.preset,
      desde: rango.desde,
      hasta: sumarDias(rango.hastaExclusivo, -1),
      granularidad: rango.granularidad,
      puntos: actividad.length,
    },
    resumen: {
      creados: creados.length,
      resueltos: resueltos.length,
      pendientesActuales: datos.pendientes.length,
      urgentesPendientes: pendientes[PrioridadTicket.URGENTE],
      altosPendientes: pendientes[PrioridadTicket.ALTA],
      pendientesMas48Horas: datos.pendientes.filter(
        (t) => t.fechaApertura < hace48Horas,
      ).length,
    },
    tiempos: {
      promedioResolucionMinutos: promedio(
        soloNumeros(
          resueltos.map((t) => minutosEntre(t.fechaApertura, t.finTrabajo)),
        ),
      ),
      promedioPrimeraAtencionMinutos: promedio(
        soloNumeros(
          resueltos.map((t) =>
            minutosEntre(t.fechaApertura, t.fechaInicioAtencion),
          ),
        ),
      ),
    },
    prioridades: {
      creadosPeriodo: contarPrioridades(creados),
      resueltosPeriodo: contarPrioridades(resueltos),
      pendientesActuales: pendientes,
    },
    comparativa: comparacion && {
      periodoAnterior: {
        desde: comparacion.desde,
        hasta: sumarDias(comparacion.hastaExclusivo, -1),
      },
      creados: comparar(
        creados.length,
        datos.creados.filter(dentro(comparacion)).length,
      ),
      resueltos: comparar(
        resueltos.length,
        datos.resueltos.filter(dentro(comparacion)).length,
      ),
    },
    actividad,
  };
}

function comparar(actual: number, anterior: number) {
  return {
    actual,
    anterior,
    variacionPorcentaje: variacionPorcentaje(actual, anterior),
  };
}

function serie(
  rango: RangoActividad,
  creados: TicketCreado[],
  resueltos: TicketResuelto[],
): PuntoActividadTickets[] {
  const { granularidad } = rango;
  const puntos = new Map<string, PuntoActividadTickets>();

  for (
    let fecha = inicioDelPunto(rango.desde, granularidad);
    fecha < rango.hastaExclusivo;
    fecha = siguientePunto(fecha, granularidad)
  ) {
    const periodo = clave(fecha, granularidad);
    puntos.set(periodo, {
      periodo,
      creados: 0,
      resueltos: 0,
      prioridades: {
        creados: contadorVacio(),
        resueltos: contadorVacio(),
      },
    });
  }

  for (const ticket of creados) {
    const punto = puntos.get(clave(ticket.fecha, granularidad));
    if (!punto) continue;
    punto.creados += 1;
    punto.prioridades.creados[ticket.prioridad] += 1;
  }

  for (const ticket of resueltos) {
    const punto = puntos.get(clave(ticket.fecha, granularidad));
    if (!punto) continue;
    punto.resueltos += 1;
    punto.prioridades.resueltos[ticket.prioridad] += 1;
  }

  return [...puntos.values()];
}

/** `2026-11-27`, `2026-11`, `2026-Q4` o `2026`. */
function clave(fecha: string, granularidad: Granularidad): string {
  switch (granularidad) {
    case Granularidad.DIA:
      return fecha;
    case Granularidad.MES:
      return fecha.slice(0, 7);
    case Granularidad.TRIMESTRE:
      return `${fecha.slice(0, 4)}-Q${Math.ceil(partes(fecha)[1] / 3)}`;
    case Granularidad.ANIO:
      return fecha.slice(0, 4);
  }
}

function inicioDelPunto(fecha: string, granularidad: Granularidad): string {
  switch (granularidad) {
    case Granularidad.DIA:
      return fecha;
    case Granularidad.MES:
      return inicioDeMes(fecha);
    case Granularidad.TRIMESTRE:
      return sumarMeses(inicioDeMes(fecha), -((partes(fecha)[1] - 1) % 3));
    case Granularidad.ANIO:
      return `${fecha.slice(0, 4)}-01-01`;
  }
}

function siguientePunto(fecha: string, granularidad: Granularidad): string {
  switch (granularidad) {
    case Granularidad.DIA:
      return sumarDias(fecha, 1);
    case Granularidad.MES:
      return sumarMeses(fecha, 1);
    case Granularidad.TRIMESTRE:
      return sumarMeses(fecha, 3);
    case Granularidad.ANIO:
      return sumarMeses(fecha, 12);
  }
}

function contadorVacio(): ConteoPorPrioridad {
  return {
    [PrioridadTicket.BAJA]: 0,
    [PrioridadTicket.MEDIA]: 0,
    [PrioridadTicket.ALTA]: 0,
    [PrioridadTicket.URGENTE]: 0,
  };
}

function contarPrioridades(
  tickets: Array<{ prioridad: PrioridadTicket }>,
): ConteoPorPrioridad {
  const conteo = contadorVacio();
  for (const ticket of tickets) conteo[ticket.prioridad] += 1;
  return conteo;
}
