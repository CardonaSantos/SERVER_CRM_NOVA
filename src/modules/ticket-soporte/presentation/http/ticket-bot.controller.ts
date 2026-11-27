import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RequiereSecretoInterno } from 'src/common/secretos/secreto-interno.guard';
import { CrearTicketBotUseCase } from '../../application/use-cases/crear-ticket-bot.use-case';
import { CrearTicketBotDto } from '../dto/crear-ticket-bot.dto';
import { TicketPresenter } from '../presenters/ticket.presenter';

@ApiTags('ticket-soporte')
@Controller('crm-bot-functions')
export class TicketBotController {
  constructor(private readonly crearTicketBot: CrearTicketBotUseCase) {}

  /**
   * Bot externo. Sin JWT: se autentica con x-internal-secret en un guard,
   * antes de validar el cuerpo (sin secreto válido → 401).
   */
  @Post('create-ticket')
  @RequiereSecretoInterno()
  async crear(@Body() dto: CrearTicketBotDto) {
    return TicketPresenter.bot(
      await this.crearTicketBot.execute({
        titulo: dto.titulo,
        descripcion: dto.descripcion,
      }),
    );
  }
}
