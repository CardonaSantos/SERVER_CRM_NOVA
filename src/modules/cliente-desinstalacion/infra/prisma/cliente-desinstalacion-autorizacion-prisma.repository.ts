import { Injectable } from '@nestjs/common';
import { PrismaTransaccional } from 'src/common/transaccion/prisma-transaccional.service';
import { ClienteDesinstalacionAutorizacionRepositoryPort } from '../../domain/ports/cliente-desinstalacion-autorizacion-repository.port';
import { ClienteDesinstalacionAutorizacionEntity } from '../../domain/entities/cliente-desinstalacion-autorizacion.entity';
import { ClienteDesinstalacionAutorizacionPrismaMapper } from './cliente-desinstalacion-autorizacion-prisma.mapper';

@Injectable()
export class ClienteDesinstalacionAutorizacionPrismaRepository
  implements ClienteDesinstalacionAutorizacionRepositoryPort
{
  constructor(private readonly transaccional: PrismaTransaccional) {}

  /** La transacción abierta por una unidad de trabajo, o el cliente normal. */
  private get db() {
    return this.transaccional.cliente;
  }

  async create(
    entity: ClienteDesinstalacionAutorizacionEntity,
  ): Promise<ClienteDesinstalacionAutorizacionEntity> {
    const record = await this.db.clienteDesinstalacionAutorizacion.create({
      data: ClienteDesinstalacionAutorizacionPrismaMapper.toCreatePersistence(
        entity,
      ),
    });

    return ClienteDesinstalacionAutorizacionPrismaMapper.toDomain(record);
  }

  async findById(
    id: number,
  ): Promise<ClienteDesinstalacionAutorizacionEntity | null> {
    const record = await this.db.clienteDesinstalacionAutorizacion.findUnique({
      where: { id },
    });

    if (!record) return null;

    return ClienteDesinstalacionAutorizacionPrismaMapper.toDomain(record);
  }

  async save(
    entity: ClienteDesinstalacionAutorizacionEntity,
  ): Promise<ClienteDesinstalacionAutorizacionEntity> {
    const props = entity.toPrimitives();

    if (!props.id) {
      throw new Error('No se puede guardar una autorización sin id.');
    }

    const record = await this.db.clienteDesinstalacionAutorizacion.update({
      where: {
        id: props.id,
      },
      data: ClienteDesinstalacionAutorizacionPrismaMapper.toUpdatePersistence(
        entity,
      ),
    });

    return ClienteDesinstalacionAutorizacionPrismaMapper.toDomain(record);
  }

  async findUltimaByDesinstalacionId(
    desinstalacionId: number,
  ): Promise<ClienteDesinstalacionAutorizacionEntity | null> {
    const record = await this.db.clienteDesinstalacionAutorizacion.findFirst({
      where: {
        desinstalacionId,
      },

      orderBy: [
        {
          fechaSolicitud: 'desc',
        },
        {
          id: 'desc',
        },
      ],
    });

    return record
      ? ClienteDesinstalacionAutorizacionPrismaMapper.toDomain(record)
      : null;
  }
}
