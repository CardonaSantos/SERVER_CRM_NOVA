import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaTransaccional } from 'src/common/transaccion/prisma-transaccional.service';
import {
  ContratoFisicoPort,
  GuardarContratoFisico,
} from '../../application/ports/contrato-fisico.port';
import { ClienteContratoDuplicadoError } from '../../domain/errors/cliente.errors';

@Injectable()
export class ContratoFisicoPrismaAdapter implements ContratoFisicoPort {
  constructor(private readonly transaccional: PrismaTransaccional) {}

  async guardar(contrato: GuardarContratoFisico): Promise<void> {
    const { clienteId, ...datos } = contrato;

    try {
      await this.transaccional.cliente.contratoFisico.upsert({
        where: { clienteId },
        update: datos,
        create: { ...datos, clienteId },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ClienteContratoDuplicadoError();
      }
      throw error;
    }
  }
}
