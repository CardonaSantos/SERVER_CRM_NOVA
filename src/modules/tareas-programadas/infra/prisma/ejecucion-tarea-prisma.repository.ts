import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaTransaccional } from 'src/common/transaccion/prisma-transaccional.service';

import { EjecucionTareaEntity } from '../../domain/entities/ejecucion-tarea.entity';
import { EstadoEjecucionTarea } from '../../domain/enums/ejecucion-tarea.enum';
import {
  EjecucionTareaRepositoryPort,
  VersionEjecucionTarea,
} from '../../domain/ports/ejecucion-tarea-repository.port';
import { EjecucionTareaPrismaMapper } from './ejecucion-tarea-prisma.mapper';

/**
 * Cada método es una sola sentencia: el candado nunca depende de una
 * transacción abierta. Las escrituras de quien ejecuta exigen su versión
 * (`intentos`) para no pisar a quien la haya retomado.
 */
@Injectable()
export class EjecucionTareaPrismaRepository
  implements EjecucionTareaRepositoryPort
{
  constructor(private readonly transaccional: PrismaTransaccional) {}

  private get db() {
    return this.transaccional.cliente;
  }

  async borrarAnterioresA(fecha: string): Promise<number> {
    const { count } = await this.db.tareaProgramadaEjecucion.deleteMany({
      where: { fechaOperativa: { lt: new Date(`${fecha}T00:00:00.000Z`) } },
    });
    return count;
  }

  async findByClave(clave: string): Promise<EjecucionTareaEntity | null> {
    const record = await this.db.tareaProgramadaEjecucion.findUnique({
      where: { clave },
    });
    return record ? EjecucionTareaPrismaMapper.toDomain(record) : null;
  }

  async crear(
    ejecucion: EjecucionTareaEntity,
  ): Promise<EjecucionTareaEntity | null> {
    try {
      const record = await this.db.tareaProgramadaEjecucion.create({
        data: EjecucionTareaPrismaMapper.toCreatePersistence(ejecucion),
      });
      return EjecucionTareaPrismaMapper.toDomain(record);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        return null;
      }
      throw error;
    }
  }

  async retomar(
    ejecucion: EjecucionTareaEntity,
    anterior: VersionEjecucionTarea,
    ahora: Date,
  ): Promise<boolean> {
    const where: Prisma.TareaProgramadaEjecucionWhereInput = {
      id: ejecucion.id!,
      estado: EjecucionTareaPrismaMapper.estadoDb(anterior.estado),
      intentos: anterior.intentos,
    };
    if (anterior.estado === EstadoEjecucionTarea.EJECUTANDO) {
      where.OR = [{ bloqueadoHasta: null }, { bloqueadoHasta: { lte: ahora } }];
    }

    const { count } = await this.db.tareaProgramadaEjecucion.updateMany({
      where,
      data: EjecucionTareaPrismaMapper.toUpdatePersistence(ejecucion),
    });
    return count === 1;
  }

  async renovarArriendo(ejecucion: EjecucionTareaEntity): Promise<boolean> {
    const { count } = await this.db.tareaProgramadaEjecucion.updateMany({
      where: {
        id: ejecucion.id!,
        estado: 'EJECUTANDO',
        intentos: ejecucion.intentos,
      },
      data: { bloqueadoHasta: ejecucion.bloqueadoHasta },
    });
    return count === 1;
  }

  async finalizar(ejecucion: EjecucionTareaEntity): Promise<boolean> {
    const { count } = await this.db.tareaProgramadaEjecucion.updateMany({
      where: {
        id: ejecucion.id!,
        estado: 'EJECUTANDO',
        intentos: ejecucion.intentos,
      },
      data: EjecucionTareaPrismaMapper.toUpdatePersistence(ejecucion),
    });
    return count === 1;
  }
}
