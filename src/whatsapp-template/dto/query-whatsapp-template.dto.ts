import { IsEnum, IsOptional, IsString } from 'class-validator';
import { WhatsappTemplateCategoryDto } from './meta-template.enums';

export enum WhatsappTemplateStatusDto {
  APPROVED = 'APPROVED',
  PENDING = 'PENDING',
  REJECTED = 'REJECTED',
  PAUSED = 'PAUSED',
  DISABLED = 'DISABLED',
  IN_APPEAL = 'IN_APPEAL',
  PENDING_DELETION = 'PENDING_DELETION',
}

export class QueryWhatsappTemplateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsEnum(WhatsappTemplateCategoryDto)
  category?: WhatsappTemplateCategoryDto;

  @IsOptional()
  @IsEnum(WhatsappTemplateStatusDto)
  status?: WhatsappTemplateStatusDto;

  @IsOptional()
  @IsString()
  limit?: string;

  @IsOptional()
  @IsString()
  after?: string;
}
