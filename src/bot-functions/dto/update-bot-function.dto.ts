import { PartialType } from '@nestjs/swagger';
import { CreateBotFunctionDto } from './create-bot-function.dto';

export class UpdateBotFunctionDto extends PartialType(CreateBotFunctionDto) {}
