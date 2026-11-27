import { Inject, Injectable } from '@nestjs/common';

import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';

import {
  MENSAJERIA_CLIENTE_EVENTOS,
  MensajeriaClienteEventosPort,
} from '../ports/mensajeria-cliente-eventos.port';

export type AvisarMensajeBotInput = { wamid: string };

/**
 * El bot (otro servidor) avisa que guardó un mensaje de WhatsApp; el CRM solo
 * lo reenvía a las pantallas para que vuelvan a pedir el chat.
 */
@Injectable()
export class AvisarMensajeBotUseCase {
  constructor(
    @Inject(MENSAJERIA_CLIENTE_EVENTOS)
    private readonly eventos: MensajeriaClienteEventosPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async execute(input: AvisarMensajeBotInput): Promise<void> {
    await this.eventos.mensajeBotRecibido({
      wamid: input.wamid,
      recibidoEn: this.reloj.ahora(),
    });
  }
}
