import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  calcularResumenConformidad,
  calcularResumenHistorial,
} from '../../domain/policies/resumen-conformidad.policy';
import { TicketConformidadQueryPort } from '../../domain/ports/ticket-conformidad-query.port';
import {
  TicketConformidadClienteReadModel,
  TicketConformidadDetalleReadModel,
  TicketConformidadFirmaReadModel,
  TicketConformidadHistorialReadModel,
  TicketConformidadPersonaReadModel,
  TicketConformidadTicketReadModel,
} from '../../domain/read-models/ticket-soporte-conformidad.read-model';
import { TicketSoporteConformidadPrismaMapper as Mapper } from './ticket-soporte-conformidad-prisma.mapper';

const personaSelect = {
  id: true,
  nombre: true,
} satisfies Prisma.UsuarioSelect;

const clienteSelect = {
  id: true,
  nombre: true,
  apellidos: true,
  telefono: true,
  direccion: true,
} satisfies Prisma.ClienteInternetSelect;

const firmaSelect = {
  id: true,
  tipo: true,
  origen: true,
  nombreFirmante: true,
  firmadoEn: true,
  usuarioFirmante: { select: personaSelect },
  media: { select: { id: true, cdnUrl: true, mimeType: true } },
} satisfies Prisma.TicketFirmaSelect;

const ticketSelect = {
  id: true,
  estado: true,
  prioridad: true,
  titulo: true,
  descripcion: true,
  fechaApertura: true,
  fechaAsignacion: true,
  fechaInicioAtencion: true,
  fechaResolucionTecnico: true,
  fechaCierre: true,
  fijado: true,
  cliente: { select: clienteSelect },
  tecnico: { select: personaSelect },
  creadoPor: { select: personaSelect },
} satisfies Prisma.TicketSoporteSelect;

/** Todo lo de un ciclo salvo el ticket, que en el historial se lee una sola vez. */
const conformidadSelect = {
  id: true,
  ticketId: true,
  clienteId: true,
  tecnicoAsignadoId: true,
  creadoPorId: true,
  resultado: true,
  creadoEn: true,
  actualizadoEn: true,
  respondidoEn: true,
  cliente: { select: clienteSelect },
  tecnicoAsignado: { select: personaSelect },
  creadoPor: { select: personaSelect },
  firmas: {
    select: firmaSelect,
    orderBy: [{ firmadoEn: 'asc' as const }, { id: 'asc' as const }],
  },
} satisfies Prisma.TicketConformidadSelect;

const conformidadConTicketSelect = {
  ...conformidadSelect,
  ticket: { select: ticketSelect },
} satisfies Prisma.TicketConformidadSelect;

const ticketConHistorialSelect = {
  ...ticketSelect,
  ticketsConformidad: {
    select: conformidadSelect,
    orderBy: [{ creadoEn: 'asc' as const }, { id: 'asc' as const }],
  },
} satisfies Prisma.TicketSoporteSelect;

type PersonaRegistro = Prisma.UsuarioGetPayload<{
  select: typeof personaSelect;
}>;
type ClienteRegistro = Prisma.ClienteInternetGetPayload<{
  select: typeof clienteSelect;
}>;
type FirmaRegistro = Prisma.TicketFirmaGetPayload<{
  select: typeof firmaSelect;
}>;
type TicketRegistro = Prisma.TicketSoporteGetPayload<{
  select: typeof ticketSelect;
}>;
type ConformidadRegistro = Prisma.TicketConformidadGetPayload<{
  select: typeof conformidadSelect;
}>;

@Injectable()
export class TicketConformidadPrismaQuery
  implements TicketConformidadQueryPort
{
  constructor(private readonly prisma: PrismaService) {}

  async findDetalleById(
    conformidadId: number,
  ): Promise<TicketConformidadDetalleReadModel | null> {
    const registro = await this.prisma.ticketConformidad.findUnique({
      where: { id: conformidadId },
      select: conformidadConTicketSelect,
    });

    return registro
      ? this.aDetalle(registro, this.aTicket(registro.ticket))
      : null;
  }

  async findLatestDetalleByTicketId(
    ticketId: number,
  ): Promise<TicketConformidadDetalleReadModel | null> {
    const registro = await this.prisma.ticketConformidad.findFirst({
      where: { ticketId },
      select: conformidadConTicketSelect,
      orderBy: [{ creadoEn: 'desc' }, { id: 'desc' }],
    });

    return registro
      ? this.aDetalle(registro, this.aTicket(registro.ticket))
      : null;
  }

  async findHistorialByTicketId(
    ticketId: number,
  ): Promise<TicketConformidadHistorialReadModel | null> {
    const registro = await this.prisma.ticketSoporte.findUnique({
      where: { id: ticketId },
      select: ticketConHistorialSelect,
    });

    if (!registro) return null;

    const ticket = this.aTicket(registro);
    const conformidades = registro.ticketsConformidad.map((item) =>
      this.aDetalle(item, ticket),
    );

    return {
      ticket,
      conformidades,
      resumen: calcularResumenHistorial(conformidades),
    };
  }

  private aDetalle(
    registro: ConformidadRegistro,
    ticket: TicketConformidadTicketReadModel,
  ): TicketConformidadDetalleReadModel {
    const firmas = registro.firmas.map((firma) => this.aFirma(firma));
    const resultado = Mapper.resultadoADominio(registro.resultado);

    return {
      id: registro.id,
      ticketId: registro.ticketId,
      clienteId: registro.clienteId,
      tecnicoAsignadoId: registro.tecnicoAsignadoId,
      creadoPorId: registro.creadoPorId,
      resultado,
      creadoEn: registro.creadoEn,
      actualizadoEn: registro.actualizadoEn,
      respondidoEn: registro.respondidoEn,
      ticket,
      cliente: this.aCliente(registro.cliente),
      tecnicoAsignado: this.aPersona(registro.tecnicoAsignado),
      creadoPor: this.aPersona(registro.creadoPor),
      firmas,
      resumen: calcularResumenConformidad({
        resultado,
        creadoEn: registro.creadoEn,
        respondidoEn: registro.respondidoEn,
        firmas,
      }),
    };
  }

  private aTicket(registro: TicketRegistro): TicketConformidadTicketReadModel {
    return {
      id: registro.id,
      estado: String(registro.estado),
      prioridad: String(registro.prioridad),
      titulo: registro.titulo,
      descripcion: registro.descripcion,
      fechaApertura: registro.fechaApertura,
      fechaAsignacion: registro.fechaAsignacion,
      fechaInicioAtencion: registro.fechaInicioAtencion,
      fechaResolucionTecnico: registro.fechaResolucionTecnico,
      fechaCierre: registro.fechaCierre,
      fijado: registro.fijado,
      clienteActual: this.aCliente(registro.cliente),
      tecnicoActual: this.aPersona(registro.tecnico),
      creadoPor: this.aPersona(registro.creadoPor),
    };
  }

  private aFirma(registro: FirmaRegistro): TicketConformidadFirmaReadModel {
    return {
      id: registro.id,
      tipo: Mapper.tipoFirmaADominio(registro.tipo),
      origen: Mapper.origenFirmaADominio(registro.origen),
      nombreFirmante: registro.nombreFirmante,
      firmadoEn: registro.firmadoEn,
      usuarioFirmante: this.aPersona(registro.usuarioFirmante),
      media: {
        id: registro.media.id,
        cdnUrl: registro.media.cdnUrl,
        mimeType: registro.media.mimeType,
      },
    };
  }

  private aPersona(
    registro: PersonaRegistro | null,
  ): TicketConformidadPersonaReadModel | null {
    return registro ? { id: registro.id, nombre: registro.nombre } : null;
  }

  private aCliente(
    registro: ClienteRegistro | null,
  ): TicketConformidadClienteReadModel | null {
    if (!registro) return null;

    return {
      id: registro.id,
      nombreCompleto: [registro.nombre, registro.apellidos]
        .filter((valor): valor is string => !!valor?.trim())
        .join(' ')
        .trim(),
      telefono: registro.telefono,
      direccion: registro.direccion,
    };
  }
}
