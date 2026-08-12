import { Injectable } from '@nestjs/common';
import { TicketConformidadResultado as PrismaTicketConformidadResultado } from '@prisma/client';

import { TicketConformidadConcurrentWriteError } from '../../../application/errors/ticket-conformidad-concurrent-write.error';
import {
  PersistirFirmaClienteTicketConformidadInput,
  PersistirFirmaClienteTicketConformidadOutput,
  PersistirRetrabajoTicketConformidadInput,
  PersistirRetrabajoTicketConformidadOutput,
  TicketConformidadTransactionPort,
} from 'src/modules/ticket-soporte-conformidad/application/port/ticket-conformidad-transaction.port';
import { PrismaService } from 'src/prisma/prisma.service';
import { TicketConformidadPrismaMapper } from '../../mappers/ticket-conformidad-prisma.mapper';
import { TicketConformidadEnlacePrismaMapper } from '../../mappers/ticket-conformidad-enlace-prisma.mapper';
import { TicketFirmaPrismaMapper } from '../../mappers/ticket-firma-prisma.mapper';

@Injectable()
export class TicketConformidadPrismaTransaction
  implements TicketConformidadTransactionPort
{
  constructor(private readonly prisma: PrismaService) {}

  async persistirRetrabajo(
    input: PersistirRetrabajoTicketConformidadInput,
  ): Promise<PersistirRetrabajoTicketConformidadOutput> {
    const conformidadId = input.conformidad.id;
    const enlaceId = input.enlace.id;

    if (conformidadId === null) {
      throw new Error('No se puede persistir una conformidad sin id.');
    }

    if (enlaceId === null) {
      throw new Error('No se puede persistir un enlace sin id.');
    }

    const conformidadData = TicketConformidadPrismaMapper.toUpdatePersistence(
      input.conformidad,
    );

    const enlaceData = TicketConformidadEnlacePrismaMapper.toUpdatePersistence(
      input.enlace,
    );

    return this.prisma.$transaction(async (tx) => {
      /*
       * Primero consumimos el enlace.
       *
       * updateMany permite imponer condiciones adicionales
       * además del id:
       *
       * - no usado
       * - no revocado
       * - todavía vigente
       *
       * Si otro request ya lo consumió, count será 0.
       */
      const enlaceResult = await tx.ticketConformidadEnlace.updateMany({
        where: {
          id: enlaceId,

          usadoEn: null,
          revocadoEn: null,

          expiraEn: {
            gt: input.fechaOperacion,
          },
        },

        data: enlaceData,
      });

      if (enlaceResult.count !== 1) {
        throw new TicketConformidadConcurrentWriteError(
          'El enlace ya no se encuentra disponible.',
        );
      }

      /*
       * La conformidad sólo puede responderse si continúa
       * en PENDIENTE.
       *
       * Esto evita que dos requests simultáneos respondan
       * exitosamente el mismo ciclo.
       */
      const conformidadResult = await tx.ticketConformidad.updateMany({
        where: {
          id: conformidadId,

          resultado: PrismaTicketConformidadResultado.PENDIENTE,
        },

        data: conformidadData,
      });

      if (conformidadResult.count !== 1) {
        throw new TicketConformidadConcurrentWriteError(
          'La conformidad ya fue respondida.',
        );
      }

      /*
       * Si llegamos aquí ambas modificaciones fueron
       * realizadas dentro de la misma transacción.
       *
       * Recuperamos los registros definitivos para
       * reconstruir las entities.
       */
      const [conformidadRecord, enlaceRecord] = await Promise.all([
        tx.ticketConformidad.findUniqueOrThrow({
          where: {
            id: conformidadId,
          },
        }),

        tx.ticketConformidadEnlace.findUniqueOrThrow({
          where: {
            id: enlaceId,
          },
        }),
      ]);

      return {
        conformidad: TicketConformidadPrismaMapper.toDomain(conformidadRecord),

        enlace: TicketConformidadEnlacePrismaMapper.toDomain(enlaceRecord),
      };
    });
  }

  async persistirFirmaCliente(
    input: PersistirFirmaClienteTicketConformidadInput,
  ): Promise<PersistirFirmaClienteTicketConformidadOutput> {
    const conformidadId = input.conformidad.id;
    const enlaceId = input.enlace.id;

    if (conformidadId === null) {
      throw new Error(
        'No se puede persistir una firma para una conformidad sin id.',
      );
    }

    if (enlaceId === null) {
      throw new Error(
        'No se puede persistir una firma utilizando un enlace sin id.',
      );
    }

    /*
     * Consistencia entre las tres entidades antes de
     * iniciar la operación de persistencia.
     */
    if (input.enlace.conformidadId !== conformidadId) {
      throw new Error('El enlace no pertenece a la conformidad indicada.');
    }

    if (input.firma.conformidadId !== conformidadId) {
      throw new Error('La firma no pertenece a la conformidad indicada.');
    }

    const conformidadData = TicketConformidadPrismaMapper.toUpdatePersistence(
      input.conformidad,
    );

    const enlaceData = TicketConformidadEnlacePrismaMapper.toUpdatePersistence(
      input.enlace,
    );

    const firmaData = TicketFirmaPrismaMapper.toCreatePersistence(input.firma);

    return this.prisma.$transaction(async (tx) => {
      /*
       * 1. Consumir el enlace solamente si sigue disponible.
       *
       * También comprobamos que efectivamente pertenezca
       * a esta conformidad.
       */
      const enlaceResult = await tx.ticketConformidadEnlace.updateMany({
        where: {
          id: enlaceId,

          conformidadId,

          usadoEn: null,

          revocadoEn: null,

          expiraEn: {
            gt: input.fechaOperacion,
          },
        },

        data: enlaceData,
      });

      if (enlaceResult.count !== 1) {
        throw new TicketConformidadConcurrentWriteError(
          'El enlace ya no se encuentra disponible.',
        );
      }

      /*
       * 2. La conformidad sólo puede pasar a CONFORME
       * si todavía continúa PENDIENTE.
       *
       * Esta condición es la que protege también contra
       * varios enlaces activos respondiendo al mismo tiempo.
       */
      const conformidadResult = await tx.ticketConformidad.updateMany({
        where: {
          id: conformidadId,

          resultado: PrismaTicketConformidadResultado.PENDIENTE,
        },

        data: conformidadData,
      });

      if (conformidadResult.count !== 1) {
        throw new TicketConformidadConcurrentWriteError(
          'La conformidad ya fue respondida.',
        );
      }

      /*
       * 3. Crear TicketFirma.
       *
       * La BD también tiene:
       *
       * @@unique([conformidadId, tipo])
       *
       * así que una conformidad no puede terminar con
       * dos firmas CLIENTE.
       */
      const firmaRecord = await tx.ticketFirma.create({
        data: firmaData,
      });

      /*
       * 4. Recuperamos el estado definitivo persistido.
       */
      const [conformidadRecord, enlaceRecord] = await Promise.all([
        tx.ticketConformidad.findUniqueOrThrow({
          where: {
            id: conformidadId,
          },
        }),

        tx.ticketConformidadEnlace.findUniqueOrThrow({
          where: {
            id: enlaceId,
          },
        }),
      ]);

      return {
        conformidad: TicketConformidadPrismaMapper.toDomain(conformidadRecord),

        enlace: TicketConformidadEnlacePrismaMapper.toDomain(enlaceRecord),

        firma: TicketFirmaPrismaMapper.toDomain(firmaRecord),
      };
    });
  }
}
