import { Injectable } from '@nestjs/common';
import { PrismaTransaccional } from 'src/common/transaccion/prisma-transaccional.service';
import { MetaTicketQueryPort } from '../../domain/ports/meta-ticket-query.port';
import { MetaTicketReadModel } from '../../domain/read-models/meta-ticket.read-model';
import {
  MetaTicketPrismaMapper,
  SELECT_META_CON_TECNICO,
} from './meta-ticket-prisma.mapper';

@Injectable()
export class MetaTicketPrismaQuery implements MetaTicketQueryPort {
  constructor(private readonly transaccional: PrismaTransaccional) {}

  private get db() {
    return this.transaccional.cliente;
  }

  async findMany(filtros: {
    tecnicoId?: number;
  }): Promise<MetaTicketReadModel[]> {
    const records = await this.db.metaTecnicoTicket.findMany({
      where: { tecnicoId: filtros.tecnicoId },
      select: SELECT_META_CON_TECNICO,
    });

    return records.map((r) => MetaTicketPrismaMapper.toReadModel(r));
  }

  async findDetail(id: number): Promise<MetaTicketReadModel | null> {
    const record = await this.db.metaTecnicoTicket.findUnique({
      where: { id },
      select: SELECT_META_CON_TECNICO,
    });

    return record ? MetaTicketPrismaMapper.toReadModel(record) : null;
  }

  async tecnicoActivo(id: number): Promise<boolean> {
    return (await this.db.usuario.count({ where: { id, activo: true } })) > 0;
  }
}
