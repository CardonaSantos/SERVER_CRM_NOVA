import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { TicketConformidadPublicReadModel } from 'src/modules/ticket-soporte-conformidad/application/models/ticket-conformidad-public.read-model';
import { TicketConformidadPublicQueryPort } from 'src/modules/ticket-soporte-conformidad/application/port/ticket-conformidad-public-query.port';
import { PrismaService } from 'src/prisma/prisma.service';

/* =========================================================
 * SELECT PÚBLICO
 * ======================================================= */

const publicConformidadSelect = {
  resultado: true,
  creadoEn: true,

  cliente: {
    select: {
      nombre: true,
      apellidos: true,
    },
  },

  tecnicoAsignado: {
    select: {
      nombre: true,
    },
  },

  ticket: {
    select: {
      id: true,

      titulo: true,
      descripcion: true,

      fechaApertura: true,
      fechaResolucionTecnico: true,
    },
  },
} satisfies Prisma.TicketConformidadSelect;

type PublicConformidadRecord = Prisma.TicketConformidadGetPayload<{
  select: typeof publicConformidadSelect;
}>;

@Injectable()
export class TicketConformidadPublicPrismaQuery
  implements TicketConformidadPublicQueryPort
{
  constructor(private readonly prisma: PrismaService) {}

  async findByConformidadId(
    conformidadId: number,
    expiraEn: Date,
  ): Promise<TicketConformidadPublicReadModel | null> {
    const record = await this.prisma.ticketConformidad.findUnique({
      where: {
        id: conformidadId,
      },

      select: publicConformidadSelect,
    });

    if (!record) {
      return null;
    }

    return this.map(record, expiraEn);
  }

  private map(
    record: PublicConformidadRecord,
    expiraEn: Date,
  ): TicketConformidadPublicReadModel {
    return {
      ticket: {
        id: record.ticket.id,

        titulo: record.ticket.titulo,
        descripcion: record.ticket.descripcion,

        fechaApertura: record.ticket.fechaApertura,

        fechaResolucionTecnico: record.ticket.fechaResolucionTecnico,
      },

      cliente: record.cliente
        ? {
            nombreCompleto: this.buildNombreCompleto(
              record.cliente.nombre,
              record.cliente.apellidos,
            ),
          }
        : null,

      tecnico: record.tecnicoAsignado
        ? {
            nombre: record.tecnicoAsignado.nombre,
          }
        : null,

      conformidad: {
        resultado: String(record.resultado),

        creadoEn: record.creadoEn,

        expiraEn,
      },
    };
  }

  private buildNombreCompleto(
    nombre: string,
    apellidos: string | null,
  ): string {
    return [nombre, apellidos]
      .filter(
        (value): value is string =>
          typeof value === 'string' && value.trim().length > 0,
      )
      .join(' ')
      .trim();
  }
}
