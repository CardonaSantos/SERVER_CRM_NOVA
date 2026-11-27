import { ConfigService } from '@nestjs/config';

import { ROLES_OFICINA, ROLES_SIN_TECNICO } from 'src/auth/roles/grupos-roles';
import { RelojFijo } from 'src/common/reloj/reloj-fijo';
import { TiempoRealEnMemoria } from 'src/common/tiempo-real/tiempo-real-en-memoria';
import { MensajeriaClienteFacadePort } from 'src/modules/mensajeria-cliente/public/mensajeria-cliente.facade.port';
import { NotificacionFacadePort } from 'src/modules/notificacion/public/notificacion.facade.port';
import { CategoriaNotificacion } from 'src/modules/notificacion/public/notificacion.types';

import { TicketParaAviso } from '../../application/ports/ticket-avisos.port';
import { TicketAvisosNotificacionAdapter } from './ticket-avisos-notificacion.adapter';

const AHORA = new Date('2026-11-27T16:00:00.000Z');

const TICKET: TicketParaAviso = {
  id: 15,
  empresaId: null,
  titulo: 'Sin señal',
  estado: 'EN_PROCESO',
  prioridad: 'ALTA',
};

describe('TicketAvisosNotificacionAdapter', () => {
  let tiempoReal: TiempoRealEnMemoria;
  let notificaciones: { notificar: jest.Mock; enviarPush: jest.Mock };
  let adapter: TicketAvisosNotificacionAdapter;

  beforeEach(() => {
    tiempoReal = new TiempoRealEnMemoria();
    notificaciones = {
      notificar: jest
        .fn()
        .mockResolvedValue({ notificacionId: 1, destinatarios: 3 }),
      enviarPush: jest.fn().mockResolvedValue({ omitido: null }),
    };
    adapter = new TicketAvisosNotificacionAdapter(
      tiempoReal,
      notificaciones as unknown as NotificacionFacadePort,
      {} as MensajeriaClienteFacadePort,
      {} as ConfigService,
      new RelojFijo(AHORA),
    );
  });

  it('avisa la asignación solo a quienes entran o salen, en español', async () => {
    await adapter.asignacion({
      ticket: TICKET,
      agregados: [7],
      retirados: [8],
      motivo: 'REASSIGNED',
    });

    const base = {
      ticketId: 15,
      motivo: 'REASIGNACION',
      titulo: 'Sin señal',
      estado: 'EN_PROCESO',
      prioridad: 'ALTA',
      ocurridoEn: AHORA.toISOString(),
    };

    expect(tiempoReal.emitidos).toEqual([
      {
        evento: 'ticket-soporte:asignacion-cambiada',
        datos: { ...base, cambio: 'ASIGNADO' },
        destino: { usuarioIds: [7] },
      },
      {
        evento: 'ticket-soporte:asignacion-cambiada',
        datos: { ...base, cambio: 'RETIRADO' },
        destino: { usuarioIds: [8] },
      },
    ]);
  });

  it('el push de asignación lleva sus datos en español', async () => {
    await adapter.asignacion({
      ticket: TICKET,
      agregados: [7],
      retirados: [],
      motivo: 'CREATED',
    });

    expect(notificaciones.enviarPush).toHaveBeenCalledWith(
      expect.objectContaining({
        usuarioId: 7,
        canal: 'tickets',
        claveAgrupacion: 'ticket-soporte-asignacion-15',
        datos: {
          tipo: 'ticket-soporte.asignacion',
          ticketId: '15',
          cambio: 'ASIGNADO',
          motivo: 'CREACION',
          estado: 'EN_PROCESO',
          prioridad: 'ALTA',
        },
      }),
    );
  });

  it('sin cambios de asignación no avisa nada', async () => {
    await adapter.asignacion({
      ticket: TICKET,
      agregados: [],
      retirados: [],
      motivo: 'CREATED',
    });

    expect(tiempoReal.emitidos).toHaveLength(0);
    expect(notificaciones.enviarPush).not.toHaveBeenCalled();
  });

  it('avisa el cambio de estado a la oficina, aunque el ticket no tenga empresa', async () => {
    await adapter.cambioEstado(TICKET, null);

    expect(tiempoReal.emitidos).toEqual([
      {
        evento: 'ticket-soporte:estado-cambiado',
        datos: {
          ticketId: 15,
          estado: 'EN_PROCESO',
          titulo: 'Sin señal',
          tecnico: null,
        },
        destino: { roles: ROLES_OFICINA },
      },
    ]);
  });

  it('el ticket del bot llega a la bandeja de todos menos técnicos', async () => {
    await adapter.ticketDelBot({
      id: 15,
      titulo: 'Sin señal',
      descripcion: null,
    });

    expect(notificaciones.notificar).toHaveBeenCalledWith(
      expect.objectContaining({
        categoria: CategoriaNotificacion.BOT,
        referencia: { tipo: 'TICKET_SOPORTE', id: 15 },
        destino: { roles: ROLES_SIN_TECNICO },
      }),
    );
  });

  it('un fallo de los avisos no lanza', async () => {
    tiempoReal.falla = new Error('caído');
    notificaciones.notificar.mockRejectedValue(new Error('base caída'));

    await expect(adapter.cambioEstado(TICKET, 'Ana')).resolves.toBeUndefined();
    await expect(
      adapter.ticketDelBot({ id: 15, titulo: null, descripcion: null }),
    ).resolves.toBeUndefined();
  });
});
