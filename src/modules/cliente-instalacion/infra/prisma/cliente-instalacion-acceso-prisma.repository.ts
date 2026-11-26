import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaTransaccional } from 'src/common/transaccion/prisma-transaccional.service';
import { ClienteInstalacionAccesoEntity } from '../../domain/entities/cliente-instalacion-acceso.entity';
import { ClienteInstalacionAccesoDuplicadoError } from '../../domain/errors/cliente-instalacion.errors';
import {
  BuscarInstalacionAccesoParams,
  ClienteInstalacionAccesoRepositoryPort,
} from '../../domain/ports/cliente-instalacion-acceso-repository.port';
import { ClienteInstalacionAccesoPrismaMapper } from './cliente-instalacion-acceso-prisma.mapper';

@Injectable()
export class ClienteInstalacionAccesoPrismaRepository
  implements ClienteInstalacionAccesoRepositoryPort
{
  constructor(private readonly transaccional: PrismaTransaccional) {}

  /** La transacción abierta por una unidad de trabajo, o el cliente normal. */
  private get db() {
    return this.transaccional.cliente;
  }

  async create(
    entity: ClienteInstalacionAccesoEntity,
  ): Promise<ClienteInstalacionAccesoEntity> {
    try {
      const record = await this.db.clienteInstalacionAcceso.create({
        data: ClienteInstalacionAccesoPrismaMapper.toCreatePersistence(entity),
      });

      return ClienteInstalacionAccesoPrismaMapper.toDomain(record);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ClienteInstalacionAccesoDuplicadoError();
      }

      throw error;
    }
  }

  async findByInstalacionId(
    instalacionId: number,
  ): Promise<ClienteInstalacionAccesoEntity | null> {
    const record = await this.db.clienteInstalacionAcceso.findUnique({
      where: { instalacionId },
    });

    return record
      ? ClienteInstalacionAccesoPrismaMapper.toDomain(record)
      : null;
  }

  async findByInstalacionAndAcceso({
    instalacionId,
    accesoInternetId,
  }: BuscarInstalacionAccesoParams): Promise<ClienteInstalacionAccesoEntity | null> {
    const entity = await this.findByInstalacionId(instalacionId);

    return entity && entity.accesoInternetId === accesoInternetId
      ? entity
      : null;
  }
}
