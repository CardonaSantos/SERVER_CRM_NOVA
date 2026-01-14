import { PrismaService } from 'src/prisma/prisma.service';
import { CreditoClienteExpedienteRepository } from '../domain/credito-cliente-expediente.repository';
import { Logger } from '@nestjs/common';
import { ClienteExpediente } from '../entities/credito-cliente-expediente.entity';
import { throwFatalError } from 'src/Utils/CommonFatalError';
import { ClienteExpedienteMapper } from '../common/cliente-expediente.mapper';

export class PrismaCreditoExpedienteRepository
  implements CreditoClienteExpedienteRepository
{
  private readonly logger = new Logger(PrismaCreditoExpedienteRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async saveExpediente(
    expediente: ClienteExpediente,
  ): Promise<ClienteExpediente> {
    try {
      //  Dominio → Persistencia
      const data = ClienteExpedienteMapper.toPersistence(expediente);

      //  Persistir
      const record = expediente.getId()
        ? await this.prisma.clienteExpediente.update({
            where: { id: expediente.getId() },
            data,
          })
        : await this.prisma.clienteExpediente.create({
            data,
          });

      //  Persistencia → Dominio
      return ClienteExpedienteMapper.toDomain(record);
    } catch (error) {
      throwFatalError(
        error,
        this.logger,
        'PrismaCreditoExpedienteRepository.saveExpediente',
      );
      throw error; // seguridad de tipado
    }
  }
  async getExpedienteByIdCredito(
    id: number,
  ): Promise<ClienteExpediente | null> {
    try {
      const record = await this.prisma.clienteExpediente.findUnique({
        where: {
          id,
        },
      });

      return ClienteExpedienteMapper.toDomain(record);
    } catch (error) {
      throwFatalError(
        error,
        this.logger,
        'PrismaCreditoExpedienteRepository.saveExpediente',
      );
      throw error; // seguridad de tipado
    }
  }
}
