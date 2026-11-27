import { Injectable } from '@nestjs/common';

import { PrismaTransaccional } from 'src/common/transaccion/prisma-transaccional.service';
import {
  BuscarPerfilPorRouterCodigoParams,
  BuscarPerfilPorRouterServicioParams,
  PerfilHomologacionRepositoryPort,
} from '../../domain/ports/perfil-homologacion-repository.port';
import { PerfilHomologacionEntity } from '../../domain/entities/perfil-homologacion.entity';
import { PerfilHomologacionPrismaMapper } from './perfil-homologacion-prisma.mapper';
import { Prisma } from '@prisma/client';
import {
  PerfilHomologacionCodigoDuplicadoError,
  PerfilHomologacionDuplicadoError,
} from '../../domain/errors/pppoe-perfil-homologacion.errors';

@Injectable()
export class PerfilHomologacionPrismaRepository
  implements PerfilHomologacionRepositoryPort
{
  constructor(private readonly transaccional: PrismaTransaccional) {}

  private get db() {
    return this.transaccional.cliente;
  }

  async create(
    entity: PerfilHomologacionEntity,
  ): Promise<PerfilHomologacionEntity> {
    const record = await this.db.pppoePerfilHomologacion
      .create({
        data: PerfilHomologacionPrismaMapper.toCreatePersistence(entity),
      })
      .catch((e: unknown) => this.traducirUnico(e));

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

    const record = await this.db.pppoePerfilHomologacion
      .update({
        where: { id },
        data: PerfilHomologacionPrismaMapper.toUpdatePersistence(entity),
      })
      .catch((e: unknown) => this.traducirUnico(e));

    return PerfilHomologacionPrismaMapper.toDomain(record);
  }

  async findById(id: number): Promise<PerfilHomologacionEntity | null> {
    const record = await this.db.pppoePerfilHomologacion.findUnique({
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
    const record = await this.db.pppoePerfilHomologacion.findUnique({
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
    const record = await this.db.pppoePerfilHomologacion.findFirst({
      where: {
        mikrotikRouterId,
        servicioInternetId,
        activo: true,
      },
    });

    return record ? PerfilHomologacionPrismaMapper.toDomain(record) : null;
  }

  async findByRouterAndCode({
    mikrotikRouterId,
    codigoPerfil,
  }: BuscarPerfilPorRouterCodigoParams): Promise<PerfilHomologacionEntity | null> {
    const record = await this.db.pppoePerfilHomologacion.findUnique({
      where: {
        mikrotikRouterId_codigoPerfil: {
          mikrotikRouterId,
          codigoPerfil,
        },
      },
    });

    return record ? PerfilHomologacionPrismaMapper.toDomain(record) : null;
  }

  private traducirUnico(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      const campos = JSON.stringify(error.meta?.target ?? '');
      throw campos.includes('codigoPerfil')
        ? new PerfilHomologacionCodigoDuplicadoError()
        : new PerfilHomologacionDuplicadoError();
    }
    throw error;
  }
}
