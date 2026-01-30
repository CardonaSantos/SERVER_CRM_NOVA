import { ClienteReferencia as PrismaReferencia } from '@prisma/client';
import { ClienteReferencia } from '../entities/cliente-referencia.entity';
export class ClienteReferenciaMapper {
  static toDomain(record: PrismaReferencia): ClienteReferencia {
    return ClienteReferencia.rehidratar({
      id: record.id,
      expedienteId: record.expedienteId,
      nombre: record.nombre,
      telefono: record.telefono,
      relacion: record.relacion,
    });
  }

  static toPersistence(ref: ClienteReferencia) {
    return {
      expedienteId: ref.getExpedienteId(),
      nombre: ref.getNombre(),
      telefono: ref.getTelefono(),
      relacion: ref.getRelacion(),
    };
  }
}
