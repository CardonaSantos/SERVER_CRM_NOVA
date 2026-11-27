import { Inject, Injectable } from '@nestjs/common';

import { ROLES_OFICINA } from 'src/auth/roles/grupos-roles';
import {
  DestinoTiempoReal,
  TIEMPO_REAL,
  TiempoRealPort,
} from 'src/common/tiempo-real/tiempo-real.port';

import {
  TecnicoTrackingRealtimePort,
  TecnicoTrackingStateChangedPayload,
} from '../../application/ports/tecnico-tracking-realtime.port';
import { TecnicoTrackingRealtimeView } from '../../domain/read-models/tecnico-tracking.read-model';

export const EVENTO_TRACKING_UBICACION_ACTUALIZADA =
  'tracking:ubicacion-actualizada';
export const EVENTO_TRACKING_ESTADO_CAMBIADO = 'tracking:estado-cambiado';

const iso = (fecha: Date) => fecha.toISOString();

/**
 * Mismos campos que un elemento de `GET real-time-location/tracking/realtime`,
 * sin el teléfono: la pantalla reemplaza la fila del técnico.
 */
export function datosUbicacionActualizada(v: TecnicoTrackingRealtimeView) {
  return {
    tecnico: {
      id: v.tecnico.id,
      nombre: v.tecnico.nombre,
      rol: v.tecnico.rol,
      avatarUrl: v.tecnico.avatarUrl,
    },
    tracking: {
      sesionId: v.tracking.sesionId,
      asistenciaId: v.tracking.asistenciaId,
      minutosSesionActual: v.tracking.minutosSesionActual,
      estado: v.tracking.estado,
      iniciadoEn: iso(v.tracking.iniciadoEn),
      ultimoHeartbeatEn: iso(v.tracking.ultimoHeartbeatEn),
    },
    jornada: {
      fecha: iso(v.jornada.fecha),
      horaEntrada: iso(v.jornada.horaEntrada),
      horaSalida: iso(v.jornada.horaSalida),
      sesionesTotal: v.jornada.sesionesTotal,
      sesionesFinalizadas: v.jornada.sesionesFinalizadas,
      sesionesExpiradas: v.jornada.sesionesExpiradas,
      minutosTracking: v.jornada.minutosTracking,
      minutosJornadaConfirmados: v.jornada.minutosJornadaConfirmados,
      minutosSinTrackingConfirmados: v.jornada.minutosSinTrackingConfirmados,
    },
    ubicacion: v.ubicacion
      ? {
          latitud: v.ubicacion.latitud,
          longitud: v.ubicacion.longitud,
          precision: v.ubicacion.precision,
          velocidad: v.ubicacion.velocidad,
          bateria: v.ubicacion.bateria,
          capturadoEn: v.ubicacion.capturadoEn
            ? iso(v.ubicacion.capturadoEn)
            : null,
          recibidoEn: iso(v.ubicacion.recibidoEn),
        }
      : null,
    actividad: {
      ticketsEnProceso: v.actividad.ticketsEnProceso.map((t) => ({
        id: t.id,
        titulo: t.titulo,
        estado: t.estado,
        prioridad: t.prioridad,
      })),
    },
  };
}

export function datosEstadoCambiado(p: TecnicoTrackingStateChangedPayload) {
  return {
    tecnicoId: p.tecnicoId,
    sesionTrackingId: p.sesionTrackingId,
    asistenciaId: p.asistenciaId,
    estado: p.estado,
    iniciadoEn: iso(p.iniciadoEn),
    finalizadoEn: p.finalizadoEn ? iso(p.finalizadoEn) : null,
    ultimoHeartbeatEn: iso(p.ultimoHeartbeatEn),
  };
}

/** La oficina sigue a todos; el técnico solo se ve a sí mismo. */
const destino = (tecnicoId: number): DestinoTiempoReal => ({
  roles: ROLES_OFICINA,
  usuarioIds: [tecnicoId],
});

@Injectable()
export class TecnicoTrackingWebSocketAdapter
  implements TecnicoTrackingRealtimePort
{
  constructor(
    @Inject(TIEMPO_REAL) private readonly tiempoReal: TiempoRealPort,
  ) {}

  emitLocationUpdated(payload: TecnicoTrackingRealtimeView): Promise<void> {
    this.tiempoReal.emitir(
      EVENTO_TRACKING_UBICACION_ACTUALIZADA,
      datosUbicacionActualizada(payload),
      destino(payload.tecnico.id),
    );

    return Promise.resolve();
  }

  emitTrackingStateChanged(
    payload: TecnicoTrackingStateChangedPayload,
  ): Promise<void> {
    this.tiempoReal.emitir(
      EVENTO_TRACKING_ESTADO_CAMBIADO,
      datosEstadoCambiado(payload),
      destino(payload.tecnicoId),
    );

    return Promise.resolve();
  }
}
