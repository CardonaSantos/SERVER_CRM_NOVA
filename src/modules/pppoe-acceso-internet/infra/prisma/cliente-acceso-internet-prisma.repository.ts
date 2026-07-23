import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  BuscarAccesoInternetDelClienteParams,
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
