import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaTransaccional } from 'src/common/transaccion/prisma-transaccional.service';

import { FotoMensualCarteraEntity } from '../../domain/entities/foto-mensual-cartera.entity';
import { FotoMensualCarteraRepositoryPort } from '../../domain/ports/foto-mensual-cartera-repository.port';
import { FotoMensualCarteraPrismaMapper } from './foto-mensual-cartera-prisma.mapper';

@Injectable()
export class FotoMensualCarteraPrismaRepository
  implements FotoMensualCarteraRepositoryPort
{
  constructor(private readonly transaccional: PrismaTransaccional) {}

  private get db() {
    return this.transaccional.cliente;
  }

  async guardarSiNoExiste(foto: FotoMensualCarteraEntity): Promise<boolean> {
    try {
      await this.db.fotoMensualCartera.create({
        data: FotoMensualCarteraPrismaMapper.toCreatePersistence(foto),
      });
      return true;
    } catch (error) {
      // El mes ya tiene foto (`mes` es único): no se reemplaza.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        return false;
      }
      throw error;
    }
  }
}
