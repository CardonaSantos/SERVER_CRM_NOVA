import { PrismaService } from 'src/prisma/prisma.service';
import { CreditoClienteExpedienteRepository } from '../domain/credito-cliente-expediente.repository';
import { Injectable, Logger } from '@nestjs/common';
import { ClienteExpediente } from '../entities/credito-cliente-expediente.entity';
import { throwFatalError } from 'src/Utils/CommonFatalError';
import { ClienteExpedienteMapper } from '../common/cliente-expediente.mapper';
import { ClienteArchivo } from '../entities/cliente-archivo.entity';
import { ClienteArchivoMapper } from '../common/cliente-archivo.mapper';
import { ClienteReferencia } from '../entities/cliente-referencia.entity';
import { ClienteReferenciaMapper } from '../common/cliente-referencia.mapper';
import { Prisma } from '@prisma/client';

@Injectable()
export class PrismaCreditoExpedienteRepository
  implements CreditoClienteExpedienteRepository
{
  private readonly logger = new Logger(PrismaCreditoExpedienteRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async findByClienteId(
    clienteId: number,
    tx?: Prisma.TransactionClient,
  ): Promise<ClienteExpediente | null> {
    const prisma = tx ?? this.prisma;

    const record = await prisma.clienteExpediente.findFirst({
      where: { clienteId },
      include: {
        archivos: true,
        referencias: true,
      },
    });

    return record ? ClienteExpedienteMapper.toDomain(record) : null;
  }

  async saveExpediente(
    expediente: ClienteExpediente,
    tx?: Prisma.TransactionClient,
  ): Promise<ClienteExpediente> {
    const prisma = tx ?? this.prisma;

    try {
      const persisted = await prisma.clienteExpediente.upsert({
        where: { clienteId: expediente.getClienteId() },
        update: {
          fuenteIngresos: expediente.getFuenteIngresos(),
          tieneDeudas: expediente.getTieneDeudas(),
          detalleDeudas: expediente.getDetalleDeudas(),
        },
        create: {
          clienteId: expediente.getClienteId(),
          fuenteIngresos: expediente.getFuenteIngresos(),
          tieneDeudas: expediente.getTieneDeudas(),
          detalleDeudas: expediente.getDetalleDeudas(),
        },
      });

      return await this.findByClienteId(expediente.getClienteId(), prisma);
    } catch (error) {
      throwFatalError(
        error,
        this.logger,
        'PrismaCreditoExpedienteRepository.save',
      );
    }
  }

  async saveMedia(
    clienteArchivo: ClienteArchivo,
    tx?: Prisma.TransactionClient,
  ): Promise<ClienteArchivo> {
    const prisma = tx ?? this.prisma;

    try {
      if (!clienteArchivo.getExpedienteId()) {
        throw new Error('expedienteId requerido para guardar archivo');
      }

      const mediaData = ClienteArchivoMapper.toPersistence(clienteArchivo);

      const newRecord = await prisma.clienteArchivo.create({
        data: mediaData,
      });

      return ClienteArchivo.rehidratar({
        id: newRecord.id,
        expedienteId: newRecord.expedienteId,
        tipo: newRecord.tipo,
        url: newRecord.url,
        descripcion: newRecord.descripcion ?? undefined,
      });
    } catch (error) {
      throwFatalError(
        error,
        this.logger,
        'PrismaCreditoExpedienteRepository.saveMedia',
      );
    }
  }

  async saveReferencia(
    referencia: ClienteReferencia,
    tx?: Prisma.TransactionClient,
  ): Promise<ClienteReferencia> {
    const prisma = tx ?? this.prisma;

    try {
      if (!referencia.getExpedienteId()) {
        throw new Error('expedienteId requerido para guardar referencia');
      }

      const data = ClienteReferenciaMapper.toPersistence(referencia);

      const record = await prisma.clienteReferencia.create({
        data,
      });

      return ClienteReferencia.rehidratar({
        id: record.id,
        expedienteId: record.expedienteId,
        nombre: record.nombre,
        telefono: record.telefono,
        relacion: record.relacion,
      });
    } catch (error) {
      throwFatalError(
        error,
        this.logger,
        'PrismaCreditoExpedienteRepository.saveReferencia',
      );
    }
  }

  async getAllMedia(expedienteId?: number): Promise<ClienteArchivo[]> {
    try {
      const records = await this.prisma.clienteArchivo.findMany({
        where: expedienteId ? { expedienteId } : undefined,
        orderBy: { creadoEn: 'desc' },
      });

      return records.map((r) =>
        ClienteArchivo.rehidratar({
          id: r.id,
          expedienteId: r.expedienteId,
          tipo: r.tipo,
          url: r.url,
          descripcion: r.descripcion ?? undefined,
        }),
      );
    } catch (error) {
      throwFatalError(
        error,
        this.logger,
        'PrismaCreditoExpedienteRepository.getAllMedia',
      );
    }
  }

  async deleteExpediente(expedienteId: number): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.clienteArchivo.deleteMany({
        where: { expedienteId },
      });

      await tx.clienteReferencia.deleteMany({
        where: { expedienteId },
      });

      await tx.clienteExpediente.delete({
        where: { id: expedienteId },
      });
    });
  }
}
