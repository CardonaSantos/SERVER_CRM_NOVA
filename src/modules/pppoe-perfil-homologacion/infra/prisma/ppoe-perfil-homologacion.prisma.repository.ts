import { Injectable } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import {
  BuscarPerfilPorRouterServicioParams,
  PerfilHomologacionRepositoryPort,
} from '../../domain/ports/ppoe-perfil-homologacion.port';
import { PerfilHomologacionEntity } from '../../domain/entities/ppoe-perfil-homologacion.entity';
import { PerfilHomologacionPrismaMapper } from './ppoe-perfil-homologacion.mapper.prisma';

@Injectable()
export class PerfilHomologacionPrismaRepository
  implements PerfilHomologacionRepositoryPort
{
  constructor(private readonly prisma: PrismaService) {}

  async create(
    entity: PerfilHomologacionEntity,
  ): Promise<PerfilHomologacionEntity> {
    const record = await this.prisma.pppoePerfilHomologacion.create({
      data: PerfilHomologacionPrismaMapper.toCreatePersistence(entity),
    });

    return PerfilHomologacionPrismaMapper.toDomain(record);
  }

  async update(
    entity: PerfilHomologacionEntity,
  ): Promise<PerfilHomologacionEntity> {
    const id = entity.id;

    if (id === null) {
      throw new Error(
        'No se puede actualizar una homologación sin identificador.',
      );
    }

    const record = await this.prisma.pppoePerfilHomologacion.update({
      where: {
        id,
      },

      data: PerfilHomologacionPrismaMapper.toUpdatePersistence(entity),
    });

    return PerfilHomologacionPrismaMapper.toDomain(record);
  }

  async findById(id: number): Promise<PerfilHomologacionEntity | null> {
    const record = await this.prisma.pppoePerfilHomologacion.findUnique({
      where: {
        id,
      },
    });

    return record ? PerfilHomologacionPrismaMapper.toDomain(record) : null;
  }

  async findByRouterAndService({
    mikrotikRouterId,
    servicioInternetId,
  }: BuscarPerfilPorRouterServicioParams): Promise<PerfilHomologacionEntity | null> {
    const record = await this.prisma.pppoePerfilHomologacion.findUnique({
      where: {
        mikrotikRouterId_servicioInternetId: {
          mikrotikRouterId,
          servicioInternetId,
        },
      },
    });

    return record ? PerfilHomologacionPrismaMapper.toDomain(record) : null;
  }

  async findActiveByRouterAndService({
    mikrotikRouterId,
    servicioInternetId,
  }: BuscarPerfilPorRouterServicioParams): Promise<PerfilHomologacionEntity | null> {
    const record = await this.prisma.pppoePerfilHomologacion.findFirst({
      where: {
        mikrotikRouterId,
        servicioInternetId,
        activo: true,
      },
    });

    return record ? PerfilHomologacionPrismaMapper.toDomain(record) : null;
  }
}
