import { Injectable } from '@nestjs/common';
import { Prisma, PrioridadTicketSoporte } from '@prisma/client';
import {
  fechaNegocioDe,
  rangoDiasNegocio,
} from 'src/common/reloj/fecha-negocio';
import { PrismaService } from 'src/prisma/prisma.service';
import { EstadoInstalacionCliente } from '../../../cliente-instalacion/public/cliente-instalacion.types';
import {
  BandejaTicket,
  estadosDeBandeja,
} from '../../../ticket-soporte/public/ticket-soporte.types';
import {
  RangoFechas,
  sumarDias,
} from '../../domain/policies/calendario.policy';
import {
  CargaParams,
  PanelTecnicoQueryPort,
} from '../../domain/ports/panel-tecnico-query.port';
import {
  CargaTecnico,
  InstalacionCompletadaTecnico,
  TecnicoDelPanel,
  TicketResueltoTecnico,
} from '../../domain/read-models/panel-tecnico.read-model';

const INSTALACIONES_PENDIENTES = [
  EstadoInstalacionCliente.PROGRAMADA,
  EstadoInstalacionCliente.REPROGRAMADA,
  EstadoInstalacionCliente.EN_PROCESO,
];

@Injectable()
export class PanelTecnicoPrismaQuery implements PanelTecnicoQueryPort {
  constructor(private readonly prisma: PrismaService) {}

  findTecnico(tecnicoId: number): Promise<TecnicoDelPanel | null> {
    return this.prisma.usuario.findUnique({
      where: { id: tecnicoId },
      select: {
        id: true,
        nombre: true,
        correo: true,
        rol: true,
        activo: true,
      },
    });
  }

  async contarCarga(params: CargaParams): Promise<CargaTecnico> {
    const { tecnicoId, hoy, hace48Horas } = params;
    const propios = participa(tecnicoId);
    const activos = {
      ...propios,
      estado: { in: estadosDeBandeja(BandejaTicket.ACTIVOS) },
    };
    const listos = {
      ...propios,
      estado: {
        in: [
          ...estadosDeBandeja(BandejaTicket.ABIERTOS),
          ...estadosDeBandeja(BandejaTicket.EN_PROCESO),
        ],
      },
    };
    const instalaciones = {
      tecnicos: { some: { tecnicoId } },
      estado: { in: INSTALACIONES_PENDIENTES },
    } satisfies Prisma.ClienteInstalacionWhereInput;
    const dia = instantes(hoy);

    const [
      ticketsPendientes,
      ticketsListosParaTrabajar,
      ticketsUrgentes,
      ticketsConMas48Horas,
      instalacionesPendientes,
      instalacionesProgramadasHoy,
      instalacionesAtrasadas,
    ] = await Promise.all([
      this.prisma.ticketSoporte.count({ where: activos }),
      this.prisma.ticketSoporte.count({ where: listos }),
      this.prisma.ticketSoporte.count({
        where: { ...activos, prioridad: PrioridadTicketSoporte.URGENTE },
      }),
      this.prisma.ticketSoporte.count({
        where: { ...activos, fechaApertura: { lt: hace48Horas } },
      }),
      this.prisma.clienteInstalacion.count({ where: instalaciones }),
      this.prisma.clienteInstalacion.count({
        where: { ...instalaciones, fechaProgramada: dia },
      }),
      this.prisma.clienteInstalacion.count({
        where: { ...instalaciones, fechaProgramada: { lt: dia.gte } },
      }),
    ]);

    return {
      ticketsPendientes,
      ticketsListosParaTrabajar,
      ticketsUrgentes,
      ticketsConMas48Horas,
      instalacionesPendientes,
      instalacionesProgramadasHoy,
      instalacionesAtrasadas,
    };
  }

  async findTicketsResueltos(
    tecnicoId: number,
    rango: RangoFechas,
  ): Promise<TicketResueltoTecnico[]> {
    const filas = await this.prisma.ticketSoporte.findMany({
      where: {
        ...participa(tecnicoId),
        estado: { in: estadosDeBandeja(BandejaTicket.RESUELTOS) },
        fechaCierre: instantes(rango),
      },
      select: {
        fechaApertura: true,
        fechaAsignacion: true,
        fechaInicioAtencion: true,
        fechaResolucionTecnico: true,
        fechaCierre: true,
      },
    });

    return filas.map((t) => ({
      fecha: fechaNegocioDe(t.fechaCierre!),
      inicio: t.fechaInicioAtencion ?? t.fechaAsignacion ?? t.fechaApertura,
      fin: t.fechaResolucionTecnico ?? t.fechaCierre,
    }));
  }

  async findInstalacionesCompletadas(
    tecnicoId: number,
    rango: RangoFechas,
  ): Promise<InstalacionCompletadaTecnico[]> {
    const filas = await this.prisma.clienteInstalacion.findMany({
      where: {
        estado: EstadoInstalacionCliente.COMPLETADA,
        fechaFinalizacion: instantes(rango),
        OR: [
          { completadoPorId: tecnicoId },
          { tecnicos: { some: { tecnicoId } } },
        ],
      },
      select: {
        fechaProgramada: true,
        fechaInicio: true,
        fechaFinalizacion: true,
        tecnicos: {
          where: { tecnicoId },
          select: { tiempoMinutos: true },
        },
      },
    });

    return filas.map((i) => ({
      fecha: fechaNegocioDe(i.fechaFinalizacion!),
      minutosRegistrados: i.tecnicos[0]?.tiempoMinutos ?? null,
      inicio: i.fechaInicio ?? i.fechaProgramada,
      fin: i.fechaFinalizacion!,
    }));
  }
}

/** El técnico es el principal o va de apoyo. */
function participa(tecnicoId: number): Prisma.TicketSoporteWhereInput {
  return {
    OR: [{ tecnicoId }, { asignaciones: { some: { tecnicoId } } }],
  };
}

function instantes(rango: RangoFechas) {
  return rangoDiasNegocio(rango.desde, sumarDias(rango.hastaExclusivo, -1));
}
