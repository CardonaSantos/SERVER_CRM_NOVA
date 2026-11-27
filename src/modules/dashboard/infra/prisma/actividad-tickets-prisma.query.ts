import { Injectable } from '@nestjs/common';
import {
  fechaNegocioDe,
  rangoDiasNegocio,
} from 'src/common/reloj/fecha-negocio';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  BandejaTicket,
  estadosDeBandeja,
  PrioridadTicket,
} from '../../../ticket-soporte/public/ticket-soporte.types';
import {
  RangoFechas,
  sumarDias,
} from '../../domain/policies/calendario.policy';
import { ActividadTicketsQueryPort } from '../../domain/ports/actividad-tickets-query.port';
import {
  TicketCreado,
  TicketPendiente,
  TicketResuelto,
} from '../../domain/read-models/actividad-tickets.read-model';

@Injectable()
export class ActividadTicketsPrismaQuery implements ActividadTicketsQueryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findPrimeraApertura(): Promise<string | null> {
    const primero = await this.prisma.ticketSoporte.findFirst({
      orderBy: { fechaApertura: 'asc' },
      select: { fechaApertura: true },
    });

    return primero ? fechaNegocioDe(primero.fechaApertura) : null;
  }

  async findCreados(rango: RangoFechas): Promise<TicketCreado[]> {
    const filas = await this.prisma.ticketSoporte.findMany({
      where: { fechaApertura: instantes(rango) },
      select: { fechaApertura: true, prioridad: true },
    });

    return filas.map((t) => ({
      fecha: fechaNegocioDe(t.fechaApertura),
      fechaApertura: t.fechaApertura,
      prioridad: t.prioridad as PrioridadTicket,
    }));
  }

  async findResueltos(rango: RangoFechas): Promise<TicketResuelto[]> {
    const filas = await this.prisma.ticketSoporte.findMany({
      where: {
        estado: { in: estadosDeBandeja(BandejaTicket.RESUELTOS) },
        fechaCierre: instantes(rango),
      },
      select: {
        prioridad: true,
        fechaApertura: true,
        fechaInicioAtencion: true,
        fechaResolucionTecnico: true,
        fechaCierre: true,
      },
    });

    return filas.map((t) => ({
      fecha: fechaNegocioDe(t.fechaCierre!),
      prioridad: t.prioridad as PrioridadTicket,
      fechaApertura: t.fechaApertura,
      fechaInicioAtencion: t.fechaInicioAtencion,
      finTrabajo: t.fechaResolucionTecnico ?? t.fechaCierre!,
    }));
  }

  async findPendientes(): Promise<TicketPendiente[]> {
    const filas = await this.prisma.ticketSoporte.findMany({
      where: { estado: { in: estadosDeBandeja(BandejaTicket.ACTIVOS) } },
      select: { prioridad: true, fechaApertura: true },
    });

    return filas.map((t) => ({
      prioridad: t.prioridad as PrioridadTicket,
      fechaApertura: t.fechaApertura,
    }));
  }
}

function instantes(rango: RangoFechas) {
  return rangoDiasNegocio(rango.desde, sumarDias(rango.hastaExclusivo, -1));
}
