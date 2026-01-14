import { PartialType } from '@nestjs/mapped-types';
import { CreateCreditoCronDto } from './create-credito-cron.dto';

export class UpdateCreditoCronDto extends PartialType(CreateCreditoCronDto) {}
