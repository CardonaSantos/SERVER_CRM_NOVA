import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaTransaccional } from 'src/common/transaccion/prisma-transaccional.service';
import { TicketFirmaEntity } from '../../domain/entities/ticket-firma.entity';
import { TicketFirmaTipo } from '../../domain/enums/ticket-firma-tipo.enum';
import { TicketFirmaDuplicadaError } from '../../domain/errors/ticket-soporte-conformidad.errors';
import { TicketFirmaRepositoryPort } from '../../domain/ports/ticket-firma-repository.port';
import { TicketSoporteConformidadPrismaMapper } from './ticket-soporte-conformidad-prisma.mapper';

@Injectable()
export class TicketFirmaPrismaRepository implements TicketFirmaRepositoryPort {
  constructor(private readonly transaccional: PrismaTransaccional) {}

  /** La transacción abierta por una unidad de trabajo, o el cliente normal. */
  private get db() {
    return this.transaccional.cliente;
  }

  async create(entity: TicketFirmaEntity): Promise<TicketFirmaEntity> {
    try {
      const registro = await this.db.ticketFirma.create({
        data: TicketSoporteConformidadPrismaMapper.firmaToCreatePersistence(
          entity,
        ),
      });

      return TicketSoporteConformidadPrismaMapper.firmaToDomain(registro);
    } catch (error) {
      // Única por (conformidadId, tipo): otra petición firmó entre la
      // comprobación y el guardado.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new TicketFirmaDuplicadaError();
      }

      throw error;
    }
  }

  async existsByConformidadAndTipo(
    conformidadId: number,
    tipo: TicketFirmaTipo,
  ): Promise<boolean> {
    const registro = await this.db.ticketFirma.findUnique({
      where: {
        conformidadId_tipo: {
          conformidadId,
          tipo: TicketSoporteConformidadPrismaMapper.tipoFirmaAPrisma(tipo),
        },
      },
      select: { id: true },
    });

    return registro !== null;
  }
}
