import { Empresa, Prisma } from '@prisma/client';
import { EmpresaEntity } from '../../domain/entities/empresa.entity';

export class EmpresaPrismaMapper {
  static toDomain(record: Empresa): EmpresaEntity {
    return EmpresaEntity.hydrate({
      id: record.id,
      nombre: record.nombre,
      direccion: record.direccion,
      telefono: record.telefono,
      pbx: record.pbx,
      correo: record.correo,
      sitioWeb: record.sitioWeb,
      nit: record.nit,
      logo1: record.logo1,
      logo2: record.logo2,
      logo3: record.logo3,
      actualizadoEn: record.actualizadoEn,
    });
  }

  static toUpdatePersistence(
    empresa: EmpresaEntity,
  ): Prisma.EmpresaUpdateInput {
    const props = empresa.toPrimitives();

    return {
      nombre: props.nombre,
      direccion: props.direccion,
      telefono: props.telefono,
      pbx: props.pbx,
      correo: props.correo,
      sitioWeb: props.sitioWeb,
      nit: props.nit,
      logo1: props.logo1,
      logo2: props.logo2,
      logo3: props.logo3,
      actualizadoEn: props.actualizadoEn,
    };
  }
}
