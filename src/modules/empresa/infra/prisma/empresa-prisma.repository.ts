import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaTransaccional } from 'src/common/transaccion/prisma-transaccional.service';
import { EmpresaEntity } from '../../domain/entities/empresa.entity';
import { EmpresaNombreEnUsoError } from '../../domain/errors/empresa.errors';
import { EmpresaRepositoryPort } from '../../domain/ports/empresa-repository.port';
import { EmpresaPrismaMapper } from './empresa-prisma.mapper';

@Injectable()
export class EmpresaPrismaRepository implements EmpresaRepositoryPort {
  constructor(private readonly transaccional: PrismaTransaccional) {}

  private get db() {
    return this.transaccional.cliente;
  }

  async findById(id: number): Promise<EmpresaEntity | null> {
    const record = await this.db.empresa.findUnique({ where: { id } });

    return record ? EmpresaPrismaMapper.toDomain(record) : null;
  }

  async update(empresa: EmpresaEntity): Promise<EmpresaEntity> {
    try {
      const record = await this.db.empresa.update({
        where: { id: empresa.id },
        data: EmpresaPrismaMapper.toUpdatePersistence(empresa),
      });

      return EmpresaPrismaMapper.toDomain(record);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new EmpresaNombreEnUsoError();
      }
      throw error;
    }
  }
}
