import { ROLES_OFICINA } from 'src/auth/roles/grupos-roles';
import { RelojFijo } from 'src/common/reloj/reloj-fijo';
import { TiempoRealEnMemoria } from 'src/common/tiempo-real/tiempo-real-en-memoria';

import { MensajeriaClienteEventosWebsocketAdapter } from '../../infra/websocket/mensajeria-cliente-eventos-websocket.adapter';
import { MensajeriaClienteEventosFake } from '../../test/fakes/mensajeria-cliente-eventos.fake';
import { AvisarMensajeBotUseCase } from './avisar-mensaje-bot.use-case';

const AHORA = new Date('2026-11-27T16:00:00.000Z');

describe('AvisarMensajeBotUseCase', () => {
  it('avisa el mensaje con la hora del servidor', async () => {
    const eventos = new MensajeriaClienteEventosFake();
    const useCase = new AvisarMensajeBotUseCase(eventos, new RelojFijo(AHORA));

    await useCase.execute({ wamid: 'wamid.ABC' });

    expect(eventos.avisos).toEqual([{ wamid: 'wamid.ABC', recibidoEn: AHORA }]);
  });

  it('el adaptador lo emite solo a la oficina, con fecha ISO', async () => {
    const tiempoReal = new TiempoRealEnMemoria();
    const adapter = new MensajeriaClienteEventosWebsocketAdapter(tiempoReal);

    await adapter.mensajeBotRecibido({ wamid: 'wamid.ABC', recibidoEn: AHORA });

    expect(tiempoReal.emitidos).toEqual([
      {
        evento: 'mensajeria-cliente:mensaje-recibido',
        datos: { wamid: 'wamid.ABC', recibidoEn: AHORA.toISOString() },
        destino: { roles: ROLES_OFICINA },
      },
    ]);
  });
});
