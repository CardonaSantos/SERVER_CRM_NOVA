import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ClientePppoeCuentaRepositoryPort } from '../../domain/ports/pppoe-cliente-cuenta.port';
import { ClientePppoeCuentaEntity } from '../../domain/entities/ppoe-cliente-cuenta.entity';
import { ClientePppoeCuentaPrismaMapper } from './pppoe-cliente-cuenta.mapper';

@Injectable()
export class ClientePppoeCuentaPrismaRepository
  implements ClientePppoeCuentaRepositoryPort
{
  constructor(private readonly prisma: PrismaService) {}

  async create(
    entity: ClientePppoeCuentaEntity,
  ): Promise<ClientePppoeCuentaEntity> {
    const record = await this.prisma.clientePppoeCuenta.create({
      data: ClientePppoeCuentaPrismaMapper.toCreatePersistence(entity),
    });

    return ClientePppoeCuentaPrismaMapper.toDomain(record);
  }

  async update(
    entity: ClientePppoeCuentaEntity,
  ): Promise<ClientePppoeCuentaEntity> {
    const id = entity.id;

    if (id === null) {
      throw new Error(
        'No se puede actualizar una cuenta PPPoE sin identificador.',
      );
    }

    const record = await this.prisma.clientePppoeCuenta.update({
      where: {
        id,
      },

      data: ClientePppoeCuentaPrismaMapper.toUpdatePersistence(entity),
    });

    return ClientePppoeCuentaPrismaMapper.toDomain(record);
  }

  async findById(id: number): Promise<ClientePppoeCuentaEntity | null> {
    const record = await this.prisma.clientePppoeCuenta.findUnique({
      where: {
        id,
      },
    });

    return record ? ClientePppoeCuentaPrismaMapper.toDomain(record) : null;
  }

  async findByAccesoInternetId(
    accesoInternetId: number,
  ): Promise<ClientePppoeCuentaEntity | null> {
    const record = await this.prisma.clientePppoeCuenta.findUnique({
      where: {
        accesoInternetId,
      },
    });

    return record ? ClientePppoeCuentaPrismaMapper.toDomain(record) : null;
  }

  async findByUsuario(
    usuario: string,
  ): Promise<ClientePppoeCuentaEntity | null> {
    const record = await this.prisma.clientePppoeCuenta.findFirst({
      where: {
        usuario,
      },
    });

    return record ? ClientePppoeCuentaPrismaMapper.toDomain(record) : null;
  }
}
