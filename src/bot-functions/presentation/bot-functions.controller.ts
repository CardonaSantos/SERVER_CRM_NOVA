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

@Controller('crm-bot-functions')
export class BotFunctionsController {
  constructor(
    private readonly botFunctionsService: BotFunctionsService,

    private readonly config: ConfigService,
  ) {}

  @Post('create-ticket')
  create(
    @Body() createBotFunctionDto: CreateBotFunctionDto,
    @Headers('x-internal-secret') secretKey: string,
  ) {
    const INTERNAL_SECRET = this.config.get('INTERNAL_SECRET');

    if (INTERNAL_SECRET !== secretKey) {
      throw new UnauthorizedException('TOKEN NO AUTORIZADO');
    }

    return this.botFunctionsService.create(createBotFunctionDto);
  }
}
