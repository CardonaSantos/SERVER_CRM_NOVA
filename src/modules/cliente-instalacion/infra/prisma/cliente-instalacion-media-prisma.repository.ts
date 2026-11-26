import { Injectable } from '@nestjs/common';
import { PrismaTransaccional } from 'src/common/transaccion/prisma-transaccional.service';
import { ClienteInstalacionMediaEntity } from '../../domain/entities/cliente-instalacion-media.entity';
import { ClienteInstalacionMediaRepositoryPort } from '../../domain/ports/cliente-instalacion-media-repository.port';
import { ClienteInstalacionMediaPrismaMapper } from './cliente-instalacion-media-prisma.mapper';

@Injectable()
export class ClienteInstalacionMediaPrismaRepository
  implements ClienteInstalacionMediaRepositoryPort
{
  constructor(private readonly transaccional: PrismaTransaccional) {}

  /** La transacción abierta por una unidad de trabajo, o el cliente normal. */
  private get db() {
    return this.transaccional.cliente;
  }

  async create(
    entity: ClienteInstalacionMediaEntity,
  ): Promise<ClienteInstalacionMediaEntity> {
    const record = await this.db.clienteInstalacionMedia.create({
      data: ClienteInstalacionMediaPrismaMapper.toCreatePersistence(entity),
    });

    return ClienteInstalacionMediaPrismaMapper.toDomain(record);
  }
}
