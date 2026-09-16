import { Injectable } from '@nestjs/common';
import { ClienteInstalacionAccesoEntity } from 'src/modules/ppoe-instalacion-acceso/domain/entities/ppoe-instalacion-acceso.entity';
import {
  BuscarInstalacionAccesoParams,
  ClienteInstalacionAccesoRepositoryPort,
} from 'src/modules/ppoe-instalacion-acceso/domain/ports/cliente-instalacion-acceso.port';
import { ClienteInstalacionAccesoPrismaMapper } from 'src/modules/ppoe-instalacion-acceso/infra/prisma/cliente-instalacion-acceso.mapper';

import { PrismaService } from 'src/prisma/prisma.service';
// import {
//   BuscarInstalacionAccesoParams,
//   ClienteInstalacionAccesoRepositoryPort,
// } from '../../domain/ports/cliente-instalacion-acceso.port';
// import { ClienteInstalacionAccesoEntity } from '../../domain/entities/pppoe-instalacion-acceso.entity';
// import { ClienteInstalacionAccesoPrismaMapper } from './cliente-instalacion-acceso.mapper';

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
    const record = await this.prisma.clienteInstalacionAcceso.findFirst({
      where: {
        instalacionId,
        accesoInternetId,
      },
    });

    return record
      ? ClienteInstalacionAccesoPrismaMapper.toDomain(record)
      : null;
  }
}
