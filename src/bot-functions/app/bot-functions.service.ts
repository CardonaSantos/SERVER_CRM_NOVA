import { Injectable, Logger } from '@nestjs/common';
import { CreateBotFunctionDto } from '../dto/create-bot-function.dto';
import { UpdateBotFunctionDto } from '../dto/update-bot-function.dto';
import { throwFatalError } from 'src/Utils/CommonFatalError';

@Injectable()
export class BotFunctionsService {
  private readonly logger = new Logger(BotFunctionsService.name);
  create(createBotFunctionDto: CreateBotFunctionDto) {
    try {
    } catch (error) {
      throwFatalError(error, this.logger, 'BotFunctionService -create');
    }
  }
}
