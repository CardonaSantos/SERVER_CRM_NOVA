import {
  ActividadDiaTecnico,
  InstalacionCompletadaTecnico,
  PanelTecnicoReadModel,
  TicketResueltoTecnico,
} from '../read-models/panel-tecnico.read-model';
import { diaDelMes, inicioDeMes, partes, sumarDias } from './calendario.policy';
import {
  minutosEntre,
  promedio,
  redondear,
  soloNumeros,
} from './estadisticas.policy';

type Productividad = Pick<
  PanelTecnicoReadModel,
  'productividadMes' | 'tiempos' | 'resumenActividad' | 'actividadDiaria'
>;

export function productividadDelMes(
  hoy: string,
  tickets: TicketResueltoTecnico[],
  instalaciones: InstalacionCompletadaTecnico[],
): Productividad {
  const diasTranscurridos = diaDelMes(hoy);
  const actividad = actividadDiaria(hoy, tickets, instalaciones);
  const conActividad = actividad.filter((dia) => dia.total > 0);
  const completados = tickets.length + instalaciones.length;

  return {
    productividadMes: {
      ticketsResueltos: tickets.length,
      instalacionesCompletadas: instalaciones.length,
      trabajosCompletados: completados,
      diasConActividad: conActividad.length,
      promedioTicketsPorDia: redondear(tickets.length / diasTranscurridos),
      ritmoSemanalTickets: redondear((tickets.length / diasTranscurridos) * 7),
      promedioTrabajosPorDiaActivo: conActividad.length
        ? redondear(completados / conActividad.length)
        : 0,
    },
    tiempos: {
      promedioResolucionTicketMinutos: promedio(
        soloNumeros(tickets.map((t) => minutosEntre(t.inicio, t.fin))),
      ),
      promedioInstalacionMinutos: promedio(
        soloNumeros(
          instalaciones.map((i) =>
            i.minutosRegistrados !== null && i.minutosRegistrados >= 0
              ? i.minutosRegistrados
              : minutosEntre(i.inicio, i.fin),
          ),
        ),
      ),
    },
    resumenActividad: {
      diaMasProductivo: extremo(conActividad, (a, b) => a > b),
      diaMenosProductivoConActividad: extremo(conActividad, (a, b) => a < b),
    },
    actividadDiaria: actividad,
  };
}

function actividadDiaria(
  hoy: string,
  tickets: TicketResueltoTecnico[],
  instalaciones: InstalacionCompletadaTecnico[],
): ActividadDiaTecnico[] {
  const desde = inicioDeMes(hoy);

  return Array.from({ length: diaDelMes(hoy) }, (_, i) => {
    const fecha = sumarDias(desde, i);
    const resueltos = tickets.filter((t) => t.fecha === fecha).length;
    const completadas = instalaciones.filter((t) => t.fecha === fecha).length;

    return {
      fecha,
      etiqueta: etiquetaDia(fecha),
      tickets: resueltos,
      instalaciones: completadas,
      total: resueltos + completadas,
    };
  });
}

/** El primero de los días que gana; `null` si no hubo actividad. */
function extremo(
  dias: ActividadDiaTecnico[],
  gana: (a: number, b: number) => boolean,
): ActividadDiaTecnico | null {
  if (!dias.length) return null;

  return dias.reduce((mejor, dia) =>
    gana(dia.total, mejor.total) ? dia : mejor,
  );
}

/** `vie 27`. */
function etiquetaDia(fecha: string): string {
  const [anio, mes, dia] = partes(fecha);
  const nombre = new Intl.DateTimeFormat('es-GT', {
    timeZone: 'UTC',
    weekday: 'short',
  })
    .format(Date.UTC(anio, mes - 1, dia))
    .replace('.', '');

  return `${nombre} ${dia}`;
}
