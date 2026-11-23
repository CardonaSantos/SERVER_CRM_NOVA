import { Body, Controller, Post } from '@nestjs/common';
import { CreateBotFunctionDto } from '../dto/create-bot-function.dto';
import { BotFunctionsService } from '../app/bot-functions.service';
import { RequiereSecretoInterno } from 'src/common/secretos/secreto-interno.guard';

@Controller('crm-bot-functions')
export class BotFunctionsController {
  constructor(private readonly botFunctionsService: BotFunctionsService) {}

  /**
   * Bot externo. Sin JWT: se autentica con x-internal-secret en un guard,
   * antes de validar el body (sin secreto válido → 401).
   */
  @Post('create-ticket')
  @RequiereSecretoInterno()
  create(@Body() createBotFunctionDto: CreateBotFunctionDto) {
    return this.botFunctionsService.create(createBotFunctionDto);
  }
}
