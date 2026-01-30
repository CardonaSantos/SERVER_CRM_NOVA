import { PrismaService } from 'src/prisma/prisma.service';
import { CreditoClienteExpedienteRepository } from '../domain/credito-cliente-expediente.repository';
import { Logger } from '@nestjs/common';
import { ClienteExpediente } from '../entities/credito-cliente-expediente.entity';
import { throwFatalError } from 'src/Utils/CommonFatalError';
import { ClienteExpedienteMapper } from '../common/cliente-expediente.mapper';
import { ClienteArchivo } from '../entities/cliente-archivo.entity';
import { ClienteArchivoMapper } from '../common/cliente-archivo.mapper';

export class PrismaCreditoExpedienteRepository
  implements CreditoClienteExpedienteRepository
{
  private readonly logger = new Logger(PrismaCreditoExpedienteRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async findByClienteId(clienteId: number): Promise<ClienteExpediente | null> {
    try {
      const record = await this.prisma.clienteExpediente.findUnique({
        where: {
          id: clienteId,
        },
      });

      if (!record) throw Error('Registro no encontrado');

      return ClienteExpedienteMapper.toDomain(record);
    } catch (error) {
      throwFatalError(
        error,
        this.logger,
        'PrismaCreditoExpedienteRepository.findByClienteId',
      );
    }
  }
  async save(expediente: ClienteExpediente): Promise<ClienteExpediente> {
    try {
      const data = ClienteExpedienteMapper.toPersistence(expediente);

      const record = await this.prisma.clienteExpediente.create({
        data: data,
      });

      return ClienteExpedienteMapper.toDomain(record);
    } catch (error) {
      throwFatalError(
        error,
        this.logger,
        'PrismaCreditoExpedienteRepository.save',
      );
    }
  }

  async saveMedia(clienteArchivo: ClienteArchivo): Promise<ClienteArchivo> {
    try {
      const mediaData = ClienteArchivoMapper.toPersistence(clienteArchivo);

      const newRecord = await this.prisma.clienteArchivo.create({
        data: mediaData,
      });

      return ClienteArchivo.rehidratar(newRecord);
    } catch (error) {
      throwFatalError(
        error,
        this.logger,
        'PrismaCreditoExpedienteRepository.saveMedia',
      );
    }
  }

  async getAllMedia(): Promise<Array<ClienteArchivo>> {
    try {
      const records = await this.prisma.clienteArchivo.findMany({});
      return records.map((r) => ClienteArchivo.rehidratar(r));
    } catch (error) {
      throwFatalError(
        error,
        this.logger,
        'PrismaCreditoExpedienteRepository.getAllMedia',
      );
    }
  }
}
