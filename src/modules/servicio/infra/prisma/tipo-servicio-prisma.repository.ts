import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaTransaccional } from 'src/common/transaccion/prisma-transaccional.service';
import { TipoServicioEntity } from '../../domain/entities/tipo-servicio.entity';
import { TipoServicioNombreDuplicadoError } from '../../domain/errors/servicio.errors';
import { TipoServicioRepositoryPort } from '../../domain/ports/tipo-servicio-repository.port';
import { TipoServicioPrismaMapper } from './tipo-servicio-prisma.mapper';

@Injectable()
export class TipoServicioPrismaRepository
  implements TipoServicioRepositoryPort
{
  constructor(private readonly transaccional: PrismaTransaccional) {}

  private get db() {
    return this.transaccional.cliente;
  }

  async findById(id: number): Promise<TipoServicioEntity | null> {
    const record = await this.db.tipoServicio.findUnique({ where: { id } });

    return record ? TipoServicioPrismaMapper.toDomain(record) : null;
  }

  async findAll(): Promise<TipoServicioEntity[]> {
    const records = await this.db.tipoServicio.findMany({
      orderBy: [{ nombre: 'asc' }, { id: 'asc' }],
    });

    return records.map((record) => TipoServicioPrismaMapper.toDomain(record));
  }

  async create(entity: TipoServicioEntity): Promise<TipoServicioEntity> {
    try {
      const record = await this.db.tipoServicio.create({
        data: TipoServicioPrismaMapper.toCreatePersistence(entity),
      });

      return TipoServicioPrismaMapper.toDomain(record);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new TipoServicioNombreDuplicadoError();
      }
      throw error;
    }
  }
}
