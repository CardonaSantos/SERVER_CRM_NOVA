import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaTransaccional } from 'src/common/transaccion/prisma-transaccional.service';
import { PlantillaContratoEntity } from '../../domain/entities/plantilla-contrato.entity';
import { PlantillaContratoNoEncontradaError } from '../../domain/errors/contrato-cliente.errors';
import { PlantillaContratoRepositoryPort } from '../../domain/ports/plantilla-contrato-repository.port';
import { PlantillaContratoPrismaMapper } from './contrato-cliente-prisma.mapper';

@Injectable()
export class PlantillaContratoPrismaRepository
  implements PlantillaContratoRepositoryPort
{
  constructor(private readonly transaccional: PrismaTransaccional) {}

  private get db() {
    return this.transaccional.cliente;
  }

  async create(
    plantilla: PlantillaContratoEntity,
  ): Promise<PlantillaContratoEntity> {
    const creada = await this.db.plantillaContrato.create({
      data: PlantillaContratoPrismaMapper.toCreatePersistence(plantilla),
    });

    return PlantillaContratoPrismaMapper.toDomain(creada);
  }

  async update(
    plantilla: PlantillaContratoEntity,
  ): Promise<PlantillaContratoEntity> {
    try {
      const guardada = await this.db.plantillaContrato.update({
        where: { id: plantilla.id! },
        data: PlantillaContratoPrismaMapper.toUpdatePersistence(plantilla),
      });

      return PlantillaContratoPrismaMapper.toDomain(guardada);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new PlantillaContratoNoEncontradaError();
      }
      throw error;
    }
  }

  async findById(id: number): Promise<PlantillaContratoEntity | null> {
    const record = await this.db.plantillaContrato.findUnique({
      where: { id },
    });

    return record ? PlantillaContratoPrismaMapper.toDomain(record) : null;
  }

  async delete(id: number): Promise<boolean> {
    const { count } = await this.db.plantillaContrato.deleteMany({
      where: { id },
    });

    return count > 0;
  }
}
