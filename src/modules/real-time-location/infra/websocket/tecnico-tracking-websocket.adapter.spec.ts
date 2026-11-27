import { ROLES_OFICINA } from 'src/auth/roles/grupos-roles';
import { TiempoRealEnMemoria } from 'src/common/tiempo-real/tiempo-real-en-memoria';

import { EstadoTrackingTecnico } from '../../domain/enums/estado-tracking-tecnico.enum';
import { TecnicoTrackingRealtimeView } from '../../domain/read-models/tecnico-tracking.read-model';
import {
  datosUbicacionActualizada,
  TecnicoTrackingWebSocketAdapter,
} from './tecnico-tracking-websocket.adapter';

const F = new Date('2026-11-27T15:00:00.000Z');

const VISTA: TecnicoTrackingRealtimeView = {
  tecnico: {
    id: 7,
    nombre: 'Técnico',
    telefono: '+50200000000',
    rol: 'TECNICO',
    avatarUrl: null,
  },
  tracking: {
    sesionId: 1,
    asistenciaId: 2,
    minutosSesionActual: 30,
    estado: EstadoTrackingTecnico.ACTIVA,
    iniciadoEn: F,
    ultimoHeartbeatEn: F,
  },
  jornada: {
    fecha: F,
    horaEntrada: F,
    horaSalida: F,
    sesionesTotal: 1,
    sesionesFinalizadas: 0,
    sesionesExpiradas: 0,
    minutosTracking: 30,
    minutosJornadaConfirmados: 30,
    minutosSinTrackingConfirmados: 0,
  },
  ubicacion: {
    latitud: 14.6,
    longitud: -90.5,
    precision: 5,
    velocidad: null,
    bateria: 70,
    capturadoEn: null,
    recibidoEn: F,
  },
  actividad: { ticketsEnProceso: [] },
};

describe('TecnicoTrackingWebSocketAdapter', () => {
  let tiempoReal: TiempoRealEnMemoria;
  let adapter: TecnicoTrackingWebSocketAdapter;

  beforeEach(() => {
    tiempoReal = new TiempoRealEnMemoria();
    adapter = new TecnicoTrackingWebSocketAdapter(tiempoReal);
  });

  it('la ubicación llega a la oficina y al propio técnico, sin teléfono', async () => {
    await adapter.emitLocationUpdated(VISTA);

    const [emitido] = tiempoReal.emitidos;
    const datos = emitido.datos as ReturnType<typeof datosUbicacionActualizada>;

    expect(emitido.evento).toBe('tracking:ubicacion-actualizada');
    expect(emitido.destino).toEqual({
      roles: ROLES_OFICINA,
      usuarioIds: [7],
    });
    expect(datos.tecnico).toEqual({
      id: 7,
      nombre: 'Técnico',
      rol: 'TECNICO',
      avatarUrl: null,
    });
    expect(JSON.stringify(datos)).not.toContain('+50200000000');
    expect(datos.tracking.iniciadoEn).toBe(F.toISOString());
    expect(datos.ubicacion?.capturadoEn).toBeNull();
  });

  it('el cambio de estado lleva fechas ISO y el mismo destino', async () => {
    await adapter.emitTrackingStateChanged({
      tecnicoId: 7,
      sesionTrackingId: 1,
      asistenciaId: 2,
      estado: EstadoTrackingTecnico.FINALIZADA,
      iniciadoEn: F,
      finalizadoEn: F,
      ultimoHeartbeatEn: F,
    });

    expect(tiempoReal.emitidos).toEqual([
      {
        evento: 'tracking:estado-cambiado',
        destino: { roles: ROLES_OFICINA, usuarioIds: [7] },
        datos: {
          tecnicoId: 7,
          sesionTrackingId: 1,
          asistenciaId: 2,
          estado: EstadoTrackingTecnico.FINALIZADA,
          iniciadoEn: F.toISOString(),
          finalizadoEn: F.toISOString(),
          ultimoHeartbeatEn: F.toISOString(),
        },
      },
    ]);
  });
});
