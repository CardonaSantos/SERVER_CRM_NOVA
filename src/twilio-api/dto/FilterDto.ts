// src/twilio-api/dto/filters-messages.dto.ts
import {
  IsOptional,
  IsString,
  IsInt,
  IsISO8601,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum MessageStatus {
  queued = 'queued',
  sending = 'sending',
  sent = 'sent',
  delivered = 'delivered',
  undelivered = 'undelivered',
  failed = 'failed',
  received = 'received',
  read = 'read',
}

export class FiltersDto {
  @IsInt()
  @Type(() => Number)
  limit!: number;

  @IsOptional()
  @IsString()
  pageToken?: string;

  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;

  @IsOptional()
  @IsISO8601()
  dateAfter?: string;

  @IsOptional()
  @IsISO8601()
  dateBefore?: string;

  @IsOptional()
  @IsEnum(MessageStatus)
  status?: MessageStatus;
}
