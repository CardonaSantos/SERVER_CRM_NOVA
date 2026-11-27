import { ConfigService } from '@nestjs/config';

import { ROLES_OFICINA } from 'src/auth/roles/grupos-roles';
import { RelojFijo } from 'src/common/reloj/reloj-fijo';
import { TiempoRealEnMemoria } from 'src/common/tiempo-real/tiempo-real-en-memoria';
import { MensajeriaClienteFacadePort } from 'src/modules/mensajeria-cliente/public/mensajeria-cliente.facade.port';
import { NotificacionesService } from 'src/notificaciones/app/notificaciones.service';
import { FirebasePushService } from 'src/push-notifications/infra/firebase-push.service';

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

describe('TicketAvisosNotificacionAdapter (tiempo real)', () => {
  let tiempoReal: TiempoRealEnMemoria;
  let push: { sendToUser: jest.Mock };
  let adapter: TicketAvisosNotificacionAdapter;

  beforeEach(() => {
    tiempoReal = new TiempoRealEnMemoria();
    push = { sendToUser: jest.fn().mockResolvedValue(undefined) };
    adapter = new TicketAvisosNotificacionAdapter(
      tiempoReal,
      push as unknown as FirebasePushService,
      {} as NotificacionesService,
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
    expect(push.sendToUser).toHaveBeenCalledTimes(2);
  });

  it('sin cambios de asignación no avisa nada', async () => {
    await adapter.asignacion({
      ticket: TICKET,
      agregados: [],
      retirados: [],
      motivo: 'CREATED',
    });

    expect(tiempoReal.emitidos).toHaveLength(0);
    expect(push.sendToUser).not.toHaveBeenCalled();
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

  it('un fallo del tiempo real no lanza', async () => {
    tiempoReal.falla = new Error('caído');

    await expect(adapter.cambioEstado(TICKET, 'Ana')).resolves.toBeUndefined();
  });
});
