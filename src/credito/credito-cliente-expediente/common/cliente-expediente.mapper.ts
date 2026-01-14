import { ClienteExpediente as PrismaExpediente } from '@prisma/client';
import { ClienteExpediente } from '../entities/credito-cliente-expediente.entity';
import { ClienteArchivoMapper } from './cliente-archivo.mapper';
import { ClienteReferenciaMapper } from './cliente-referencia.mapper';

export class ClienteExpedienteMapper {
  static toDomain(
    record: PrismaExpediente & {
      archivos?: any[];
      referencias?: any[];
    },
  ): ClienteExpediente {
    return ClienteExpediente.rehidratar({
      id: record.id,
      clienteId: record.clienteId,
      fuenteIngresos: record.fuenteIngresos ?? undefined,
      tieneDeudas: record.tieneDeudas ?? undefined,
      detalleDeudas: record.detalleDeudas ?? undefined,
      archivos: record.archivos?.map(ClienteArchivoMapper.toDomain),
      referencias: record.referencias?.map(ClienteReferenciaMapper.toDomain),
    });
  }

  static toPersistence(expediente: ClienteExpediente) {
    return {
      clienteId: expediente.getClienteId(),
      fuenteIngresos: expediente.getFuenteIngresos(),
      tieneDeudas: expediente.getTieneDeudas(),
      detalleDeudas: expediente.getDetalleDeudas(),
    };
  }
}
