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

      key: record.key ?? undefined,
      bucket: record.bucket ?? undefined,
      mimeType: record.mimeType ?? undefined,
      size: record.size ?? undefined,

      estado: record.estado,
      eliminadoAt: record.eliminadoAt ?? undefined,
    });
  }

  static toPersistence(archivo: ClienteArchivo) {
    return {
      expedienteId: archivo.getExpedienteId(),
      tipo: archivo.getTipo(),
      url: archivo.getUrl(),
      descripcion: archivo.getDescripcion(),

      key: archivo.getStorageKey(),
      bucket: archivo.getBucket(),
      mimeType: archivo.getMimeType(),
      size: archivo.getSize(),

      estado: archivo.getEstado(),
    };
  }
}
