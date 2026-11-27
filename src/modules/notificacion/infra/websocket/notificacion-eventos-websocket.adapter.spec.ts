import { TiempoRealEnMemoria } from 'src/common/tiempo-real/tiempo-real-en-memoria';

import { AudienciaNotificacion } from '../../domain/enums/audiencia-notificacion.enum';
import { CategoriaNotificacion } from '../../domain/enums/categoria-notificacion.enum';
import { SeveridadNotificacion } from '../../domain/enums/severidad-notificacion.enum';
import { NotificacionEventosWebsocketAdapter } from './notificacion-eventos-websocket.adapter';

const AHORA = new Date('2026-11-27T16:00:00.000Z');

describe('NotificacionEventosWebsocketAdapter', () => {
  it('emite a los destinatarios la forma de la bandeja, sin datos internos', async () => {
    const tiempoReal = new TiempoRealEnMemoria();

    await new NotificacionEventosWebsocketAdapter(
      tiempoReal,
    ).notificacionCreada(
      {
        id: 4,
        titulo: 'Facturación',
        mensaje: 'Zona procesada',
        categoria: CategoriaNotificacion.FACTURACION,
        severidad: SeveridadNotificacion.INFO,
        subtipo: 'CRON JOB',
        referencia: { tipo: 'FACTURACION_ZONA', id: 2 },
        ruta: null,
        etiquetaAccion: null,
        audiencia: AudienciaNotificacion.ROL,
        remitenteId: 9,
        creadaEn: AHORA,
      },
      [1, 2],
    );

    expect(tiempoReal.emitidos).toEqual([
      {
        evento: 'notificacion:creada',
        destino: { usuarioIds: [1, 2] },
        datos: {
          id: 4,
          titulo: 'Facturación',
          mensaje: 'Zona procesada',
          categoria: 'FACTURACION',
          severidad: 'INFO',
          referencia: { tipo: 'FACTURACION_ZONA', id: 2 },
          ruta: null,
          etiquetaAccion: null,
          creadaEn: AHORA.toISOString(),
          leida: false,
          leidaEn: null,
        },
      },
    ]);
  });
});
