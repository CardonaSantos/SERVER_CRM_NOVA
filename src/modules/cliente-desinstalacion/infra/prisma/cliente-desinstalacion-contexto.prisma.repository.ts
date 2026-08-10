import { Injectable } from '@nestjs/common';
import { EstadoAccesoInternet, Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { ClienteDesinstalacionContextoRepositoryPort } from '../../domain/ports/cliente-desinstalacion-contexto.repository.port';
import { ContextoCreacionDesinstalacion } from '../../domain/read-models/contexto-creacion-desinstalacion.read-model';

const contextoCreacionSelect = {
  id: true,
  nombre: true,
  apellidos: true,
  telefono: true,
  dpi: true,
  direccion: true,

  accesosInternet: {
    where: {
      estado: {
        not: EstadoAccesoInternet.BAJA,
      },
    },

    orderBy: {
      creadoEn: 'desc',
    },

    select: {
      id: true,
      servicioInternetId: true,

      tecnologia: true,
      metodoAutenticacion: true,
      estado: true,

      activadoEn: true,
      suspendidoEn: true,
      dadoDeBajaEn: true,

      servicioInternet: {
        select: {
          id: true,
          nombre: true,
          velocidad: true,
          precio: true,
        },
      },

      cuentaPppoe: {
        select: {
          id: true,
          usuario: true,
          estado: true,
          perfilHomologacionId: true,
        },
      },
    },
  },

  ticketSoporte: {
    orderBy: {
      fechaApertura: 'desc',
    },

    take: 25,

    select: {
      id: true,
      titulo: true,
      descripcion: true,
      estado: true,
      prioridad: true,
      fechaApertura: true,
      fechaCierre: true,
    },
  },
} satisfies Prisma.ClienteInternetSelect;

type ContextoCreacionRecord = Prisma.ClienteInternetGetPayload<{
  select: typeof contextoCreacionSelect;
}>;

@Injectable()
export class ClienteDesinstalacionContextoPrismaRepository
  implements ClienteDesinstalacionContextoRepositoryPort
{
  constructor(private readonly prisma: PrismaService) {}

  async findContextoCreacionByClienteId(
    clienteId: number,
  ): Promise<ContextoCreacionDesinstalacion | null> {
    const record = await this.prisma.clienteInternet.findUnique({
      where: {
        id: clienteId,
      },

      select: contextoCreacionSelect,
    });

    if (!record) {
      return null;
    }

    return this.mapRecord(record);
  }

  private mapRecord(
    record: ContextoCreacionRecord,
  ): ContextoCreacionDesinstalacion {
    return {
      cliente: {
        id: record.id,
        nombre: record.nombre,
        apellidos: record.apellidos,
        telefono: record.telefono,
        dpi: record.dpi,
        direccion: record.direccion,
      },

      accesos: record.accesosInternet.map((acceso) => ({
        id: acceso.id,
        servicioInternetId: acceso.servicioInternetId,

        tecnologia: acceso.tecnologia,
        metodoAutenticacion: acceso.metodoAutenticacion,
        estado: acceso.estado,

        activadoEn: acceso.activadoEn,
        suspendidoEn: acceso.suspendidoEn,
        dadoDeBajaEn: acceso.dadoDeBajaEn,

        servicioInternet: acceso.servicioInternet
          ? {
              id: acceso.servicioInternet.id,
              nombre: acceso.servicioInternet.nombre,
              velocidad: acceso.servicioInternet.velocidad,
              precio: acceso.servicioInternet.precio,
            }
          : null,

        cuentaPppoe: acceso.cuentaPppoe
          ? {
              id: acceso.cuentaPppoe.id,
              usuario: acceso.cuentaPppoe.usuario,
              estado: acceso.cuentaPppoe.estado,
              perfilHomologacionId: acceso.cuentaPppoe.perfilHomologacionId,
            }
          : null,
      })),

      tickets: record.ticketSoporte.map((ticket) => ({
        id: ticket.id,

        titulo: ticket.titulo,
        descripcion: ticket.descripcion,

        estado: ticket.estado,
        prioridad: ticket.prioridad,

        fechaApertura: ticket.fechaApertura,
        fechaCierre: ticket.fechaCierre,
      })),
    };
  }

  async existsTicketForClient(
    ticketId: number,
    clienteId: number,
  ): Promise<boolean> {
    const ticket = await this.prisma.ticketSoporte.findFirst({
      where: {
        id: ticketId,

        clienteId,
      },

      select: {
        id: true,
      },
    });

    return ticket !== null;
  }
}
