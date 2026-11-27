import { TecnicoMetrica } from '../read-models/meta-ticket.read-model';
import {
  RendimientoTecnico,
  ResueltosDia,
  TicketPeriodoReadModel,
} from '../read-models/metrica-ticket.read-model';
import {
  diasEntre,
  diasTranscurridos,
  fechasEntre,
  proyectar,
} from './fechas.policy';

export type Periodo = { desde: string; hasta: string };

const redondear = (valor: number, decimales: number) =>
  Number(valor.toFixed(decimales));

export function resueltoEn(
  ticket: TicketPeriodoReadModel,
  periodo: Periodo,
): boolean {
  return (
    ticket.diaCierre !== null &&
    ticket.diaCierre >= periodo.desde &&
    ticket.diaCierre <= periodo.hasta
  );
}

/** Una fila por técnico, de quien más resolvió a quien menos. */
export function rendimientoPorTecnico(
  tecnicos: TecnicoMetrica[],
  tickets: TicketPeriodoReadModel[],
  periodo: Periodo,
  hoy: string,
): RendimientoTecnico[] {
  const totales = diasEntre(periodo.desde, periodo.hasta);
  const transcurridos = diasTranscurridos(periodo.desde, periodo.hasta, hoy);

  return tecnicos
    .map((tecnico) => {
      const suyos = tickets.filter((t) => t.tecnicoIds.includes(tecnico.id));
      const resueltos = suyos.filter((t) => resueltoEn(t, periodo));
      const horas = resueltos.flatMap((t) =>
        t.horasHastaCierre === null ? [] : [t.horasHastaCierre],
      );

      return {
        tecnico,
        totalTickets: suyos.length,
        resueltos: resueltos.length,
        pendientes: suyos.length - resueltos.length,
        tasaResolucion: suyos.length
          ? redondear((resueltos.length / suyos.length) * 100, 1)
          : 0,
        horasPromedio: horas.length
          ? redondear(horas.reduce((a, b) => a + b, 0) / horas.length, 2)
          : null,
        resueltosPorDia: transcurridos
          ? redondear(resueltos.length / transcurridos, 2)
          : 0,
        proyeccion: proyectar(resueltos.length, transcurridos, totales),
      };
    })
    .sort(
      (a, b) =>
        b.resueltos - a.resueltos ||
        a.tecnico.nombre.localeCompare(b.tecnico.nombre, 'es'),
    );
}

export function resueltosPorDia(
  tickets: TicketPeriodoReadModel[],
  periodo: Periodo,
): ResueltosDia[] {
  return fechasEntre(periodo.desde, periodo.hasta).map((fecha) => {
    const delDia = tickets.filter((t) => t.diaCierre === fecha);
    const porTecnico = new Map<number, number>();

    for (const ticket of delDia) {
      for (const id of ticket.tecnicoIds) {
        porTecnico.set(id, (porTecnico.get(id) ?? 0) + 1);
      }
    }

    return {
      fecha,
      total: delDia.length,
      porTecnico: [...porTecnico]
        .map(([tecnicoId, resueltos]) => ({ tecnicoId, resueltos }))
        .sort((a, b) => a.tecnicoId - b.tecnicoId),
    };
  });
}
