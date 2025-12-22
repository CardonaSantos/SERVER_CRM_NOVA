import { Injectable, Logger } from '@nestjs/common';
import { CreateBotFunctionDto } from '../dto/create-bot-function.dto';
import { UpdateBotFunctionDto } from '../dto/update-bot-function.dto';
import { throwFatalError } from 'src/Utils/CommonFatalError';
import { TicketsSoporteService } from 'src/tickets-soporte/app/tickets-soporte.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class BotFunctionsService {
  private readonly logger = new Logger(BotFunctionsService.name);

  constructor(
    private readonly ticket: TicketsSoporteService,
    // private readonly prisma: PrismaService,
  ) {}

  async create(dto: CreateBotFunctionDto) {
    try {
      const ticketFromBot = await this.ticket.createBotTicket(dto);
      return ticketFromBot;
    } catch (error) {
      throwFatalError(error, this.logger, 'BotFunctionService -create');
    }
  }
}
