import { Injectable } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import {
  BuscarInstalacionAccesoParams,
  ClienteInstalacionAccesoRepositoryPort,
} from '../../domain/ports/cliente-instalacion-acceso.port';
import { ClienteInstalacionAccesoEntity } from '../../domain/entities/ppoe-instalacion-acceso.entity';
import { ClienteInstalacionAccesoPrismaMapper } from './cliente-instalacion-acceso.mapper';

@Injectable()
export class ClienteInstalacionAccesoPrismaRepository
  implements ClienteInstalacionAccesoRepositoryPort
{
  constructor(private readonly prisma: PrismaService) {}

  async create(
    entity: ClienteInstalacionAccesoEntity,
  ): Promise<ClienteInstalacionAccesoEntity> {
    const record = await this.prisma.clienteInstalacionAcceso.create({
      data: ClienteInstalacionAccesoPrismaMapper.toCreatePersistence(entity),
    });

    return ClienteInstalacionAccesoPrismaMapper.toDomain(record);
  }

  async findByInstalacionId(
    instalacionId: number,
  ): Promise<ClienteInstalacionAccesoEntity[]> {
    const records = await this.prisma.clienteInstalacionAcceso.findMany({
      where: {
        instalacionId,
      },
      orderBy: {
        id: 'asc',
      },
    });

    return records.map((record) =>
      ClienteInstalacionAccesoPrismaMapper.toDomain(record),
    );
  }

  async findByInstalacionAndAcceso({
    instalacionId,
    accesoInternetId,
  }: BuscarInstalacionAccesoParams): Promise<ClienteInstalacionAccesoEntity | null> {
    const record = await this.prisma.clienteInstalacionAcceso.findUnique({
      where: {
        instalacionId_accesoInternetId: {
          instalacionId,
          accesoInternetId,
        },
      },
    });

    return record
      ? ClienteInstalacionAccesoPrismaMapper.toDomain(record)
      : null;
  }
}
