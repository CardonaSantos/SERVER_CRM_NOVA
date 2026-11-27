import { Injectable } from '@nestjs/common';
import { EstadoMetaTicket } from '@prisma/client';
import { rangoDiasNegocio } from 'src/common/reloj/fecha-negocio';
import { PrismaTransaccional } from 'src/common/transaccion/prisma-transaccional.service';
import { MetaTicketEntity } from '../../domain/entities/meta-ticket.entity';
import { MetaTicketCanceladaError } from '../../domain/errors/ticket-soporte-metrica.errors';
import {
  BuscarSolapadaParams,
  MetaTicketRepositoryPort,
} from '../../domain/ports/meta-ticket-repository.port';
import { MetaTicketPrismaMapper } from './meta-ticket-prisma.mapper';

@Injectable()
export class MetaTicketPrismaRepository implements MetaTicketRepositoryPort {
  constructor(private readonly transaccional: PrismaTransaccional) {}

  private get db() {
    return this.transaccional.cliente;
  }

  async create(meta: MetaTicketEntity): Promise<MetaTicketEntity> {
    const record = await this.db.metaTecnicoTicket.create({
      data: MetaTicketPrismaMapper.toCreatePersistence(meta),
    });

    return MetaTicketPrismaMapper.toDomain(record);
  }

  async update(meta: MetaTicketEntity): Promise<void> {
    const { count } = await this.db.metaTecnicoTicket.updateMany({
      where: { id: meta.id!, estado: { not: EstadoMetaTicket.CANCELADO } },
      data: MetaTicketPrismaMapper.toUpdatePersistence(meta),
    });

    if (!count) throw new MetaTicketCanceladaError();
  }

  async findById(id: number): Promise<MetaTicketEntity | null> {
    const record = await this.db.metaTecnicoTicket.findUnique({
      where: { id },
    });

    return record ? MetaTicketPrismaMapper.toDomain(record) : null;
  }

  async bloquearTecnico(tecnicoId: number): Promise<void> {
    await this.db
      .$executeRaw`SELECT pg_advisory_xact_lock(hashtext('meta_ticket'), ${tecnicoId}::int)`;
  }

  async existeSolapada(params: BuscarSolapadaParams): Promise<boolean> {
    const { gte, lt } = rangoDiasNegocio(params.fechaInicio, params.fechaFin);

    const total = await this.db.metaTecnicoTicket.count({
      where: {
        tecnicoId: params.tecnicoId,
        estado: { not: EstadoMetaTicket.CANCELADO },
        fechaInicio: { lt },
        fechaFin: { gte },
        ...(params.excluirId ? { id: { not: params.excluirId } } : {}),
      },
    });

    return total > 0;
  }
}
