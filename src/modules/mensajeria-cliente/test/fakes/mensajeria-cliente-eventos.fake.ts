import {
  AvisoMensajeBot,
  MensajeriaClienteEventosPort,
} from '../../application/ports/mensajeria-cliente-eventos.port';

export class MensajeriaClienteEventosFake
  implements MensajeriaClienteEventosPort
{
  readonly avisos: AvisoMensajeBot[] = [];

  mensajeBotRecibido(aviso: AvisoMensajeBot): Promise<void> {
    this.avisos.push(aviso);
    return Promise.resolve();
  }
}
