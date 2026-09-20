import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { TicketSoporteHistorialEntity } from '../../domain/entities/ticket-soporte-historial.entity';
import { RegistrarActualizacionTicketCommand } from '../../application/contracts/registrar-actualizacion-ticket.command';
import { RegistrarTicketHistorialCommand } from '../../application/contracts/registrar-ticket-historial.command';
import { TicketSoporteHistorialEntryFactory } from '../../application/factories/ticket-soporte-historial-entry.factory';
import { TicketSoporteHistorialPrismaMapper } from './ticket-soporte-historial-prisma.mapper';

/**
 * Puente de compatibilidad para el TicketsSoporteService actual.
 *
 * Ese servicio ya trabaja directamente con Prisma.TransactionClient.
 * Este adapter permite insertar la auditoría DENTRO de la misma transacción
 * sin contaminar el dominio/application del nuevo módulo con Prisma.
 *
 * Cuando TicketsSoporte migre completamente a hexagonal/UoW, este bridge
 * puede desaparecer sin tocar el dominio de historial.
 */
@Injectable()
export class TicketSoporteHistorialPrismaTxBridge {
  async registrarEvento(
    tx: Prisma.TransactionClient,
    command: RegistrarTicketHistorialCommand,
  ): Promise<TicketSoporteHistorialEntity> {
    const entity = TicketSoporteHistorialEntryFactory.fromEvento(command);

    const row = await tx.ticketSoporteHistorial.create({
      data: TicketSoporteHistorialPrismaMapper.toCreateInput(entity),
    });

    return TicketSoporteHistorialPrismaMapper.toDomain(row);
  }

  async registrarActualizacion(
    tx: Prisma.TransactionClient,
    command: RegistrarActualizacionTicketCommand,
  ): Promise<TicketSoporteHistorialEntity | null> {
    const entity = TicketSoporteHistorialEntryFactory.fromActualizacion(command);

    if (!entity) {
      return null;
    }

    const row = await tx.ticketSoporteHistorial.create({
      data: TicketSoporteHistorialPrismaMapper.toCreateInput(entity),
    });

    return TicketSoporteHistorialPrismaMapper.toDomain(row);
  }
}
