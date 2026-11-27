import { EstadoMetaTicket } from '../enums/estado-meta-ticket.enum';
import {
  MetaTicketConAvance,
  MetaTicketReadModel,
} from '../read-models/meta-ticket.read-model';
import { TicketResueltoReadModel } from '../read-models/metrica-ticket.read-model';
import { diasEntre, diasTranscurridos, proyectar } from './fechas.policy';

/**
 * Cuenta los tickets resueltos del técnico (como principal o apoyo) cuyo último
 * cierre cae entre las fechas de la meta. Uno reabierto deja de contar.
 */
export function calcularAvance(
  meta: MetaTicketReadModel,
  tickets: TicketResueltoReadModel[],
  hoy: string,
): MetaTicketConAvance {
  const avance = tickets.filter(
    (t) =>
      t.tecnicoIds.includes(meta.tecnico.id) &&
      t.diaCierre >= meta.fechaInicio &&
      t.diaCierre <= meta.fechaFin,
  ).length;

  const diasTotales = diasEntre(meta.fechaInicio, meta.fechaFin);
  const transcurridos = diasTranscurridos(meta.fechaInicio, meta.fechaFin, hoy);

  return {
    ...meta,
    avance,
    faltantes: Math.max(0, meta.objetivo - avance),
    porcentaje: meta.objetivo ? Math.round((avance / meta.objetivo) * 100) : 0,
    estado: estadoDe(meta, avance, hoy),
    diasTotales,
    diasTranscurridos: transcurridos,
    proyeccion: proyectar(avance, transcurridos, diasTotales),
  };
}

function estadoDe(
  meta: MetaTicketReadModel,
  avance: number,
  hoy: string,
): EstadoMetaTicket {
  if (meta.cancelada) return EstadoMetaTicket.CANCELADA;
  if (hoy < meta.fechaInicio) return EstadoMetaTicket.PROGRAMADA;
  if (avance >= meta.objetivo) return EstadoMetaTicket.CUMPLIDA;

  return hoy > meta.fechaFin
    ? EstadoMetaTicket.NO_CUMPLIDA
    : EstadoMetaTicket.EN_CURSO;
}
