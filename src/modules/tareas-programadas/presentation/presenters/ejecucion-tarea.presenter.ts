import {
  presentarPaginado,
  RespuestaPaginada,
  ResultadoPaginado,
} from 'src/common/hexagonal/paginacion';

import {
  EjecucionTareaVista,
  TareaManualDisponible,
} from '../../domain/read-models/ejecucion-tarea-listado.read-model';
import { ResultadoTareaProgramada } from '../../public/tareas-programadas.facade.port';
import {
  EjecucionTareaResponseDto,
  ResultadoTareaManualResponseDto,
  TareaManualResponseDto,
} from '../dto/ejecucion-tarea-response.dto';

const iso = (fecha: Date | null) => (fecha ? fecha.toISOString() : null);

export class EjecucionTareaPresenter {
  static item(e: EjecucionTareaVista): EjecucionTareaResponseDto {
    return {
      id: e.id,
      clave: e.clave,
      tarea: e.tarea,
      facturacionZonaId: e.facturacionZonaId,
      fechaOperativa: e.fechaOperativa,
      origen: e.origen,
      ejecutadaPorId: e.ejecutadaPorId,
      estado: e.estado,
      abandonada: e.abandonada,
      intentos: e.intentos,
      iniciadaEn: e.iniciadaEn.toISOString(),
      finalizadaEn: iso(e.finalizadaEn),
      siguienteIntentoEn: iso(e.siguienteIntentoEn),
      procesados: e.procesados,
      errores: e.errores,
      errorCodigo: e.errorCodigo,
      errorMensaje: e.errorMensaje,
      resumen: e.resumen
        ? {
            datos: { ...e.resumen.datos },
            erroresDetalle: e.resumen.erroresDetalle.map((d) => ({
              referencia: d.referencia,
              codigo: d.codigo,
            })),
            erroresOmitidos: e.resumen.erroresOmitidos,
          }
        : null,
    };
  }

  static listado(
    r: ResultadoPaginado<EjecucionTareaVista>,
  ): RespuestaPaginada<EjecucionTareaResponseDto> {
    return presentarPaginado(r, (e) => EjecucionTareaPresenter.item(e));
  }

  static manuales(tareas: TareaManualDisponible[]): TareaManualResponseDto[] {
    return tareas.map((t) => ({ tarea: t.tarea, descripcion: t.descripcion }));
  }

  static resultadoManual(
    r: ResultadoTareaProgramada,
  ): ResultadoTareaManualResponseDto {
    return r.resultado === 'EJECUTADA'
      ? {
          resultado: r.resultado,
          motivo: null,
          ejecucionId: r.ejecucionId,
          estado: r.estado,
          errorCodigo: r.errorCodigo,
        }
      : {
          resultado: r.resultado,
          motivo: r.motivo,
          ejecucionId: r.ejecucionId,
          estado: null,
          errorCodigo: null,
        };
  }
}
