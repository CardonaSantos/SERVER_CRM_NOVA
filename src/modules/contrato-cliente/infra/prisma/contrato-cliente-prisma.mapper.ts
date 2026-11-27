import {
  ContratoServicioInternet,
  PlantillaContrato,
  Prisma,
} from '@prisma/client';
import {
  fechaNegocioDe,
  inicioDiaNegocio,
} from 'src/common/reloj/fecha-negocio';
import { ContratoClienteEntity } from '../../domain/entities/contrato-cliente.entity';
import { PlantillaContratoEntity } from '../../domain/entities/plantilla-contrato.entity';

export class ContratoClientePrismaMapper {
  static toDomain(record: ContratoServicioInternet): ContratoClienteEntity {
    return ContratoClienteEntity.hydrate({
      id: record.id,
      clienteId: record.clienteId,
      fechaInstalacionProgramada: dia(record.fechaInstalacionProgramada),
      fechaPago: dia(record.fechaPago),
      costoInstalacion: record.costoInstalacion,
      observaciones: record.observaciones,
      creadoEn: record.creadoEn,
      actualizadoEn: record.actualizadoEn,
    });
  }

  static toCreatePersistence(
    contrato: ContratoClienteEntity,
  ): Prisma.ContratoServicioInternetUncheckedCreateInput {
    const props = contrato.toPrimitives();

    return {
      clienteId: props.clienteId,
      fechaInstalacionProgramada: instante(props.fechaInstalacionProgramada),
      fechaPago: instante(props.fechaPago),
      costoInstalacion: props.costoInstalacion,
      observaciones: props.observaciones,
      creadoEn: props.creadoEn,
      actualizadoEn: props.actualizadoEn,
    };
  }
}

export class PlantillaContratoPrismaMapper {
  static toDomain(record: PlantillaContrato): PlantillaContratoEntity {
    return PlantillaContratoEntity.hydrate({
      id: record.id,
      nombre: record.nombre,
      body: record.body,
      empresaId: record.empresaId,
      creadoEn: record.creadoEn,
      actualizadoEn: record.actualizadoEn,
    });
  }

  static toCreatePersistence(
    plantilla: PlantillaContratoEntity,
  ): Prisma.PlantillaContratoCreateInput {
    const props = plantilla.toPrimitives();

    return {
      nombre: props.nombre,
      body: props.body,
      empresaId: props.empresaId,
      creadoEn: props.creadoEn,
      actualizadoEn: props.actualizadoEn,
    };
  }

  static toUpdatePersistence(
    plantilla: PlantillaContratoEntity,
  ): Prisma.PlantillaContratoUpdateInput {
    const props = plantilla.toPrimitives();

    return {
      nombre: props.nombre,
      body: props.body,
      actualizadoEn: props.actualizadoEn,
    };
  }
}

function dia(valor: Date | null): string | null {
  return valor ? fechaNegocioDe(valor) : null;
}

function instante(fecha: string | null): Date | null {
  return fecha ? inicioDiaNegocio(fecha) : null;
}
