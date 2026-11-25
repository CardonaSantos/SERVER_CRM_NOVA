import { Injectable } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';

import {
  BuscarAccesoInternetDelClienteParams,
  ClienteAccesoInternetRepositoryPort,
} from '../../domain/ports/cliente-acceso-internet-repository.port';

import { ClienteAccesoInternetEntity } from '../../domain/entities/cliente-acceso-internet.entity';

import { ClienteAccesoInternetPrismaMapper } from './cliente-acceso-internet-prisma.mapper';

import {
  EstadoAccesoInternet,
  MetodoAutenticacionInternet,
} from '../../domain/enums/cliente-acceso-internet.enum';

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
      throw new Error('No puede actualizarse un acceso sin id.');
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
    accesoInternetId: number,
  ): Promise<ClienteAccesoInternetEntity | null> {
    const record = await this.prisma.clienteAccesoInternet.findUnique({
      where: { id: accesoInternetId },
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

  async findPppoeVigenteByClienteId(
    clienteId: number,
  ): Promise<ClienteAccesoInternetEntity | null> {
    const record = await this.prisma.clienteAccesoInternet.findFirst({
      where: {
        clienteId,
        metodoAutenticacion: MetodoAutenticacionInternet.PPPOE,
        estado: {
          in: [
            EstadoAccesoInternet.PENDIENTE,
            EstadoAccesoInternet.CONFIGURANDO,
            EstadoAccesoInternet.ACTIVO,
            EstadoAccesoInternet.SUSPENDIDO,
          ],
        },
      },
      orderBy: {
        id: 'desc',
      },
    });

    if (!record) {
      return null;
    }

    return ClienteAccesoInternetPrismaMapper.toDomain(record);
  }
}
