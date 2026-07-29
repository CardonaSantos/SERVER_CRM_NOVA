import { ConflictException, Injectable } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';

import {
  BuscarAccesoInternetDelClienteParams,
  BuscarAccesoInternetPorIdParams,
  ClienteAccesoInternetRepositoryPort,
} from '../../domain/ports/ppoe-acceso-internet.port';

import { ClienteAccesoInternetEntity } from '../../domain/entities/ppoe-acceso-internet.entity';

import { ClienteAccesoInternetPrismaMapper } from './cliente-acceso-internet-prisma.mapper';

@Injectable()
export class ClienteAccesoInternetPrismaRepository
  implements ClienteAccesoInternetRepositoryPort
{
  constructor(private readonly prisma: PrismaService) {}

  async create(
    entity: ClienteAccesoInternetEntity,
  ): Promise<ClienteAccesoInternetEntity> {
    const data = ClienteAccesoInternetPrismaMapper.toCreatePersistence(entity);

    const record = await this.prisma.clienteAccesoInternet.create({
      data,
    });

    return ClienteAccesoInternetPrismaMapper.toDomain(record);
  }

  async update(
    entity: ClienteAccesoInternetEntity,
  ): Promise<ClienteAccesoInternetEntity> {
    const id = entity.id;

    if (id === null) {
      throw new ConflictException(
        'No puede actualizarse un acceso de internet sin identificador.',
      );
    }

    const data = ClienteAccesoInternetPrismaMapper.toUpdatePersistence(entity);

    const record = await this.prisma.clienteAccesoInternet.update({
      where: {
        id,
      },

      data,
    });

    return ClienteAccesoInternetPrismaMapper.toDomain(record);
  }

  async findById(
    params: BuscarAccesoInternetPorIdParams,
  ): Promise<ClienteAccesoInternetEntity | null> {
    const record = await this.prisma.clienteAccesoInternet.findFirst({
      where: {
        id: params.accesoInternetId,
        empresaId: params.empresaId,
      },
    });

    if (!record) {
      return null;
    }

    return ClienteAccesoInternetPrismaMapper.toDomain(record);
  }

  async findByIdForClient(
    params: BuscarAccesoInternetDelClienteParams,
  ): Promise<ClienteAccesoInternetEntity | null> {
    const record = await this.prisma.clienteAccesoInternet.findFirst({
      where: {
        id: params.accesoInternetId,
        clienteId: params.clienteId,
      },
    });

    if (!record) {
      return null;
    }

    return ClienteAccesoInternetPrismaMapper.toDomain(record);
  }
}
