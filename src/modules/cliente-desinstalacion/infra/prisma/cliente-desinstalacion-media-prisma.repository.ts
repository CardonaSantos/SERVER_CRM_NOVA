import { Injectable } from '@nestjs/common';
import { PrismaTransaccional } from 'src/common/transaccion/prisma-transaccional.service';
import { ClienteDesinstalacionMediaEntity } from '../../domain/entities/cliente-desinstalacion-media.entity';
import { ClienteDesinstalacionMediaRepositoryPort } from '../../domain/ports/cliente-desinstalacion-media-repository.port';
import { ClienteDesinstalacionMediaPrismaMapper } from './cliente-desinstalacion-media-prisma.mapper';

@Injectable()
export class ClienteDesinstalacionMediaPrismaRepository
  implements ClienteDesinstalacionMediaRepositoryPort
{
  constructor(private readonly transaccional: PrismaTransaccional) {}

  /** La transacción abierta por una unidad de trabajo, o el cliente normal. */
  private get db() {
    return this.transaccional.cliente;
  }

  async create(
    entity: ClienteDesinstalacionMediaEntity,
  ): Promise<ClienteDesinstalacionMediaEntity> {
    const record = await this.db.clienteDesinstalacionMedia.create({
      data: ClienteDesinstalacionMediaPrismaMapper.toCreatePersistence(entity),
    });

    return ClienteDesinstalacionMediaPrismaMapper.toDomain(record);
  }
}
