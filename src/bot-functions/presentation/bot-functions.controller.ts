import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { CreateBotFunctionDto } from '../dto/create-bot-function.dto';
import { UpdateBotFunctionDto } from '../dto/update-bot-function.dto';
import { BotFunctionsService } from '../app/bot-functions.service';

@Controller('crm-bot-functions')
export class BotFunctionsController {
  constructor(private readonly botFunctionsService: BotFunctionsService) {}

  @Post('create-ticket')
  create(@Body() createBotFunctionDto: CreateBotFunctionDto) {
    return this.botFunctionsService.create(createBotFunctionDto);
  }
}
