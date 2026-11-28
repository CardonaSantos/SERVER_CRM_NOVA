import {
  EstadoTareaProgramada,
  OrigenTareaProgramada,
  Prisma,
  TareaProgramadaEjecucion,
} from '@prisma/client';

import { EjecucionTareaEntity } from '../../domain/entities/ejecucion-tarea.entity';
import {
  EstadoEjecucionTarea,
  OrigenEjecucionTarea,
} from '../../domain/enums/ejecucion-tarea.enum';
import {
  EjecucionTareaProps,
  ErrorElementoTarea,
  ResumenEjecucionTarea,
  ValorResumen,
} from '../../domain/props/ejecucion-tarea.props';

export class EjecucionTareaPrismaMapper {
  static toDomain(record: TareaProgramadaEjecucion): EjecucionTareaEntity {
    return EjecucionTareaEntity.hydrate({
      id: record.id,
      clave: record.clave,
      tarea: record.tarea,
      facturacionZonaId: record.facturacionZonaId,
      fechaOperativa: record.fechaOperativa.toISOString().slice(0, 10),
      origen: OrigenEjecucionTarea[record.origen],
      ejecutadaPorId: record.ejecutadaPorId,
      estado: EstadoEjecucionTarea[record.estado],
      intentos: record.intentos,
      bloqueadoHasta: record.bloqueadoHasta,
      siguienteIntentoEn: record.siguienteIntentoEn,
      iniciadaEn: record.iniciadaEn,
      finalizadaEn: record.finalizadaEn,
      procesados: record.procesados,
      errores: record.errores,
      resumen: resumenDesde(record.resumen),
      errorCodigo: record.errorCodigo,
      errorMensaje: record.errorMensaje,
    });
  }

  static toCreatePersistence(
    entity: EjecucionTareaEntity,
  ): Prisma.TareaProgramadaEjecucionUncheckedCreateInput {
    const p = entity.toPrimitives();
    return {
      clave: p.clave,
      tarea: p.tarea,
      facturacionZonaId: p.facturacionZonaId,
      fechaOperativa: fechaDb(p.fechaOperativa),
      ...EjecucionTareaPrismaMapper.toUpdatePersistence(entity),
    };
  }

  /** Lo que cambia entre intentos; la identidad de la ejecución no cambia. */
  static toUpdatePersistence(entity: EjecucionTareaEntity) {
    const p: EjecucionTareaProps = entity.toPrimitives();
    return {
      origen: OrigenTareaProgramada[p.origen],
      ejecutadaPorId: p.ejecutadaPorId,
      estado: EstadoTareaProgramada[p.estado],
      intentos: p.intentos,
      bloqueadoHasta: p.bloqueadoHasta,
      siguienteIntentoEn: p.siguienteIntentoEn,
      iniciadaEn: p.iniciadaEn,
      finalizadaEn: p.finalizadaEn,
      procesados: p.procesados,
      errores: p.errores,
      resumen: p.resumen
        ? (p.resumen as unknown as Prisma.InputJsonObject)
        : Prisma.DbNull,
      errorCodigo: p.errorCodigo,
      errorMensaje: p.errorMensaje,
    };
  }

  static estadoDb(estado: EstadoEjecucionTarea): EstadoTareaProgramada {
    return EstadoTareaProgramada[estado];
  }
}

/** `@db.Date` guarda solo el día: se manda como medianoche UTC. */
function fechaDb(fecha: string): Date {
  return new Date(`${fecha}T00:00:00.000Z`);
}

function resumenDesde(
  valor: Prisma.JsonValue | null,
): ResumenEjecucionTarea | null {
  if (!valor || typeof valor !== 'object' || Array.isArray(valor)) return null;

  const datosCrudos = valor.datos;
  const datos: Record<string, ValorResumen> = {};
  if (
    datosCrudos &&
    typeof datosCrudos === 'object' &&
    !Array.isArray(datosCrudos)
  ) {
    for (const [nombre, dato] of Object.entries(datosCrudos)) {
      if (
        dato === null ||
        ['number', 'string', 'boolean'].includes(typeof dato)
      ) {
        datos[nombre] = dato as ValorResumen;
      }
    }
  }

  const erroresDetalle: ErrorElementoTarea[] = Array.isArray(
    valor.erroresDetalle,
  )
    ? valor.erroresDetalle.flatMap((item) =>
        item &&
        typeof item === 'object' &&
        !Array.isArray(item) &&
        typeof item.referencia === 'string' &&
        typeof item.codigo === 'string'
          ? [{ referencia: item.referencia, codigo: item.codigo }]
          : [],
      )
    : [];

  return {
    datos,
    erroresDetalle,
    erroresOmitidos:
      typeof valor.erroresOmitidos === 'number' ? valor.erroresOmitidos : 0,
  };
}
