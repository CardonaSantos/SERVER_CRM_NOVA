import { PartialType } from '@nestjs/mapped-types';
import { CreateBotFunctionDto } from './create-bot-function.dto';

export class UpdateBotFunctionDto extends PartialType(CreateBotFunctionDto) {}
