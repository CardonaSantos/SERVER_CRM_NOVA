import { PartialType } from '@nestjs/swagger';
import { CreateCreditoCronDto } from './create-credito-cron.dto';

export class UpdateCreditoCronDto extends PartialType(CreateCreditoCronDto) {}
