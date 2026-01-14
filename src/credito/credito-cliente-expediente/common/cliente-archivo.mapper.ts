import { ClienteArchivo } from '../entities/cliente-archivo.entity';
import { ClienteArchivo as PrismaArchivo } from '@prisma/client';

export class ClienteArchivoMapper {
  static toDomain(record: PrismaArchivo): ClienteArchivo {
    return ClienteArchivo.rehidratar({
      id: record.id,
      expedienteId: record.expedienteId,
      tipo: record.tipo,
      url: record.url,
      descripcion: record.descripcion ?? undefined,
    });
  }

  static toPersistence(archivo: ClienteArchivo) {
    return {
      expedienteId: archivo.getExpedienteId(),
      tipo: archivo.getTipo(),
      url: archivo.getUrl(),
      descripcion: archivo.getDescripcion(),
    };
  }
}
