import { Injectable, Logger } from '@nestjs/common';
import { CreateBotFunctionDto } from '../dto/create-bot-function.dto';
import { UpdateBotFunctionDto } from '../dto/update-bot-function.dto';
import { throwFatalError } from 'src/Utils/CommonFatalError';
import { TicketsSoporteService } from 'src/tickets-soporte/app/tickets-soporte.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotificacionesService } from 'src/notificaciones/app/notificaciones.service';
import { Notificacion } from 'src/notificaciones/entities/notificacione.entity';

@Injectable()
export class BotFunctionsService {
  private readonly logger = new Logger(BotFunctionsService.name);

  constructor(
    private readonly ticket: TicketsSoporteService,
    private readonly notiService: NotificacionesService,

    // private readonly prisma: PrismaService,
  ) {}

  async create(dto: CreateBotFunctionDto) {
    try {
      const ticketFromBot = await this.ticket.createBotTicket(dto);

      await this.notiService.create({
        titulo: `Nuevo ticket: ${ticketFromBot.titulo ?? ticketFromBot.id}`,
        mensaje: `Se ha generado un nuevo ticket: #${ticketFromBot.id} - ${ticketFromBot.descripcion ?? 'N/A'}`,
        audiencia: 'EMPRESA',
        severidad: 'INFO',
        categoria: 'BOT',
      });

      return ticketFromBot;
    } catch (error) {
      throwFatalError(error, this.logger, 'BotFunctionService -create');
    }
  }
}
