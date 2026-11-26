import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaTransaccional } from 'src/common/transaccion/prisma-transaccional.service';
import { ClienteDesinstalacionEntity } from '../../domain/entities/cliente-desinstalacion.entity';
import { ClienteDesinstalacionAccesoInvalidoError } from '../../domain/errors/cliente-desinstalacion.errors';
import { ClienteDesinstalacionRepositoryPort } from '../../domain/ports/cliente-desinstalacion-repository.port';
import { ClienteDesinstalacionPrismaMapper } from './cliente-desinstalacion-prisma.mapper';

@Injectable()
export class ClienteDesinstalacionPrismaRepository
  implements ClienteDesinstalacionRepositoryPort
{
  constructor(private readonly transaccional: PrismaTransaccional) {}

  /** La transacción abierta por una unidad de trabajo, o el cliente normal. */
  private get db() {
    return this.transaccional.cliente;
  }

  async create(
    entity: ClienteDesinstalacionEntity,
  ): Promise<ClienteDesinstalacionEntity> {
    try {
      const record = await this.db.clienteDesinstalacion.create({
        data: ClienteDesinstalacionPrismaMapper.toCreatePersistence(entity),
      });

      return ClienteDesinstalacionPrismaMapper.toDomain(record);
    } catch (error) {
      return this.traducirError(error);
    }
  }

  async findById(id: number): Promise<ClienteDesinstalacionEntity | null> {
    const record = await this.db.clienteDesinstalacion.findUnique({
      where: { id },
    });

    return record ? ClienteDesinstalacionPrismaMapper.toDomain(record) : null;
  }

  async save(
    entity: ClienteDesinstalacionEntity,
  ): Promise<ClienteDesinstalacionEntity> {
    const id = entity.id;

    if (id === undefined) {
      throw new Error('No se puede guardar una desinstalación sin id.');
    }

    try {
      const guardada = await this.db.clienteDesinstalacion.update({
        where: { id },
        data: ClienteDesinstalacionPrismaMapper.toUpdatePersistence(entity),
      });

      return ClienteDesinstalacionPrismaMapper.toDomain(guardada);
    } catch (error) {
      return this.traducirError(error);
    }
  }

  /** Un acceso solo puede tener una desinstalación activa (índice único). */
  private traducirError(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      const target = error.meta?.target;
      const campos = Array.isArray(target)
        ? target.map(String)
        : [String(target ?? '')];

      if (campos.includes('accesoInternetId')) {
        throw new ClienteDesinstalacionAccesoInvalidoError(
          'El acceso de internet ya tiene una desinstalación activa.',
        );
      }
    }

    throw error;
  }
}
