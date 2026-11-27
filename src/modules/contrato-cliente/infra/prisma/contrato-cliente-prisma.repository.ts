import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaTransaccional } from 'src/common/transaccion/prisma-transaccional.service';
import { ContratoClienteEntity } from '../../domain/entities/contrato-cliente.entity';
import {
  ContratoClienteNoEncontradoError,
  ContratoClienteYaExisteError,
} from '../../domain/errors/contrato-cliente.errors';
import { ContratoClienteRepositoryPort } from '../../domain/ports/contrato-cliente-repository.port';
import { ContratoClientePrismaMapper } from './contrato-cliente-prisma.mapper';

@Injectable()
export class ContratoClientePrismaRepository
  implements ContratoClienteRepositoryPort
{
  constructor(private readonly transaccional: PrismaTransaccional) {}

  private get db() {
    return this.transaccional.cliente;
  }

  async existeClienteVigente(clienteId: number): Promise<boolean> {
    const total = await this.db.clienteInternet.count({
      where: { id: clienteId, isEliminado: false },
    });

    return total > 0;
  }

  async create(
    contrato: ContratoClienteEntity,
  ): Promise<ContratoClienteEntity> {
    try {
      const creado = await this.db.contratoServicioInternet.create({
        data: ContratoClientePrismaMapper.toCreatePersistence(contrato),
      });

      return ContratoClientePrismaMapper.toDomain(creado);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') throw new ContratoClienteYaExisteError();
        if (error.code === 'P2003') {
          throw new ContratoClienteNoEncontradoError();
        }
      }
      throw error;
    }
  }
}
