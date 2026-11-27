import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaTransaccional } from 'src/common/transaccion/prisma-transaccional.service';
import { ContratoNumeroDuplicadoError } from '../../domain/errors/contrato-cliente.errors';
import { ContratoFisicoRepositoryPort } from '../../domain/ports/contrato-fisico-repository.port';
import { ContratoFisicoProps } from '../../domain/props/contrato-fisico.props';

@Injectable()
export class ContratoFisicoPrismaRepository
  implements ContratoFisicoRepositoryPort
{
  constructor(private readonly transaccional: PrismaTransaccional) {}

  async guardar(contrato: ContratoFisicoProps): Promise<void> {
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
        throw new ContratoNumeroDuplicadoError();
      }
      throw error;
    }
  }
}
