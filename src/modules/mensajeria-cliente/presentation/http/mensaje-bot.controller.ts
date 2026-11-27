import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { RequiereSecretoInterno } from 'src/common/secretos/secreto-interno.guard';

import { AvisarMensajeBotUseCase } from '../../application/use-cases/avisar-mensaje-bot.use-case';
import { AvisarMensajeBotDto } from '../dto/avisar-mensaje-bot.dto';

/** Integración con el bot de WhatsApp (servidor a servidor). */
@ApiTags('mensajeria-cliente')
@Controller('mensajeria-cliente/bot')
export class MensajeBotController {
  constructor(private readonly avisarMensaje: AvisarMensajeBotUseCase) {}

  /** El bot avisa que guardó un mensaje; el chat de la oficina se refresca. */
  @Post('mensajes')
  @RequiereSecretoInterno()
  @HttpCode(HttpStatus.NO_CONTENT)
  async mensajeRecibido(@Body() dto: AvisarMensajeBotDto): Promise<void> {
    await this.avisarMensaje.execute({ wamid: dto.wamid });
  }
}
