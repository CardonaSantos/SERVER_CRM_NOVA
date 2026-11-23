import { Public } from 'src/auth/decoradores/public.decorator';
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateBotFunctionDto } from '../dto/create-bot-function.dto';
import { UpdateBotFunctionDto } from '../dto/update-bot-function.dto';
import { BotFunctionsService } from '../app/bot-functions.service';
import { ConfigService } from '@nestjs/config';
import { secretoCoincide } from 'src/common/secretos/comparar-secreto';

@Controller('crm-bot-functions')
export class BotFunctionsController {
  constructor(
    private readonly botFunctionsService: BotFunctionsService,

    private readonly config: ConfigService,
  ) {}

  @Post('create-ticket')
  @Public()
  create(
    @Body() createBotFunctionDto: CreateBotFunctionDto,
    @Headers('x-internal-secret') secretKey: string,
  ) {
    // Falla cerrado si INTERNAL_SECRET no está configurado; tiempo constante.
    if (!secretoCoincide(secretKey, this.config.get('INTERNAL_SECRET'))) {
      throw new UnauthorizedException('TOKEN NO AUTORIZADO');
    }

    return this.botFunctionsService.create(createBotFunctionDto);
  }
}
