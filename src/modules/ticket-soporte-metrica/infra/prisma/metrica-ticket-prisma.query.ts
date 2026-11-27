import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ROLES_TECNICO } from 'src/auth/roles/grupos-roles';
import {
  fechaNegocioDe,
  rangoDiasNegocio,
} from 'src/common/reloj/fecha-negocio';
import { PrismaTransaccional } from 'src/common/transaccion/prisma-transaccional.service';
import {
  BandejaTicket,
  estadosDeBandeja,
} from '../../../ticket-soporte/public/ticket-soporte.types';
import { MetricaTicketQueryPort } from '../../domain/ports/metrica-ticket-query.port';
import { TecnicoMetrica } from '../../domain/read-models/meta-ticket.read-model';
import {
  SituacionTickets,
  TicketPeriodoReadModel,
  TicketResueltoReadModel,
} from '../../domain/read-models/metrica-ticket.read-model';

const MS_HORA = 3_600_000;

const SELECT_TICKET = {
  id: true,
  estado: true,
  fechaApertura: true,
  fechaCierre: true,
  tecnicoId: true,
  asignaciones: { select: { tecnicoId: true } },
} satisfies Prisma.TicketSoporteSelect;

type TicketRecord = Prisma.TicketSoporteGetPayload<{
  select: typeof SELECT_TICKET;
}>;

/** Principal y apoyos, sin repetir. */
function tecnicosDe(ticket: TicketRecord): number[] {
  const ids = ticket.asignaciones.map((a) => a.tecnicoId);
  if (ticket.tecnicoId !== null) ids.unshift(ticket.tecnicoId);

  return [...new Set(ids)];
}

const estados = (bandeja: BandejaTicket) => ({
  in: estadosDeBandeja(bandeja),
});

/** Solo lectura sobre las tablas de tickets y usuarios. */
@Injectable()
export class MetricaTicketPrismaQuery implements MetricaTicketQueryPort {
  constructor(private readonly transaccional: PrismaTransaccional) {}

  private get db() {
    return this.transaccional.cliente;
  }

  async ticketsResueltos(params: {
    tecnicoIds: number[];
    desde: string;
    hasta: string;
  }): Promise<TicketResueltoReadModel[]> {
    const tickets = await this.db.ticketSoporte.findMany({
      where: {
        estado: estados(BandejaTicket.RESUELTOS),
        fechaCierre: rangoDiasNegocio(params.desde, params.hasta),
        OR: [
          { tecnicoId: { in: params.tecnicoIds } },
          { asignaciones: { some: { tecnicoId: { in: params.tecnicoIds } } } },
        ],
      },
      select: SELECT_TICKET,
    });

    return tickets.map((t) => ({
      id: t.id,
      tecnicoIds: tecnicosDe(t),
      diaCierre: fechaNegocioDe(t.fechaCierre!),
    }));
  }

  async ticketsDelPeriodo(params: {
    desde: string;
    hasta: string;
  }): Promise<TicketPeriodoReadModel[]> {
    const rango = rangoDiasNegocio(params.desde, params.hasta);
    const resueltos = estadosDeBandeja(BandejaTicket.RESUELTOS);

    const tickets = await this.db.ticketSoporte.findMany({
      where: {
        estado: { notIn: estadosDeBandeja(BandejaTicket.CANCELADOS) },
        OR: [
          { fechaApertura: rango },
          { estado: { in: resueltos }, fechaCierre: rango },
        ],
      },
      select: SELECT_TICKET,
    });

    return tickets.map((t) => {
      const cierre = (resueltos as string[]).includes(t.estado)
        ? t.fechaCierre
        : null;

      return {
        id: t.id,
        tecnicoIds: tecnicosDe(t),
        diaApertura: fechaNegocioDe(t.fechaApertura),
        diaCierre: cierre ? fechaNegocioDe(cierre) : null,
        horasHastaCierre: cierre
          ? (cierre.getTime() - t.fechaApertura.getTime()) / MS_HORA
          : null,
      };
    });
  }

  tecnicos(incluirIds: number[]): Promise<TecnicoMetrica[]> {
    return this.db.usuario.findMany({
      where: {
        OR: [
          { activo: true, rol: { in: ROLES_TECNICO } },
          { id: { in: incluirIds } },
        ],
      },
      select: { id: true, nombre: true, activo: true },
    });
  }

  async situacion(hoy: string): Promise<SituacionTickets> {
    const deHoy = rangoDiasNegocio(hoy, hoy);
    const contar = (where: Prisma.TicketSoporteWhereInput) =>
      this.db.ticketSoporte.count({ where });

    const [activos, enProceso, resueltosHoy, asignadosHoy] = await Promise.all([
      contar({ estado: estados(BandejaTicket.ACTIVOS) }),
      contar({ estado: estados(BandejaTicket.EN_PROCESO) }),
      contar({
        estado: estados(BandejaTicket.RESUELTOS),
        fechaCierre: deHoy,
      }),
      contar({
        fechaApertura: deHoy,
        estado: { notIn: estadosDeBandeja(BandejaTicket.CANCELADOS) },
        OR: [{ tecnicoId: { not: null } }, { asignaciones: { some: {} } }],
      }),
    ]);

    return { activos, enProceso, resueltosHoy, asignadosHoy };
  }
}
