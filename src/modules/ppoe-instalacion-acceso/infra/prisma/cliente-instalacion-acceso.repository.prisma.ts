import { Injectable } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';

import {
  BuscarInstalacionAccesoParams,
  ClienteInstalacionAccesoRepositoryPort,
} from '../../domain/ports/cliente-instalacion-acceso.port';

import { ClienteInstalacionAccesoPrismaMapper } from './cliente-instalacion-acceso.mapper';
import { ClienteInstalacionAccesoEntity } from '../../domain/entities/ppoe-instalacion-acceso.entity';

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
  ): Promise<ClienteInstalacionAccesoEntity | null> {
    const record = await this.prisma.clienteInstalacionAcceso.findUnique({
      where: {
        instalacionId,
      },
    });

    return record
      ? ClienteInstalacionAccesoPrismaMapper.toDomain(record)
      : null;
  }

  async findByInstalacionAndAcceso({
    instalacionId,
    accesoInternetId,
  }: BuscarInstalacionAccesoParams): Promise<ClienteInstalacionAccesoEntity | null> {
    const record = await this.prisma.clienteInstalacionAcceso.findUnique({
      where: {
        instalacionId,
      },
    });

    if (!record || record.accesoInternetId !== accesoInternetId) {
      return null;
    }

    return ClienteInstalacionAccesoPrismaMapper.toDomain(record);
  }
}
