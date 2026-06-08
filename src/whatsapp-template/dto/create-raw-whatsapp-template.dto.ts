import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { WhatsappTemplateCategoryDto } from './meta-template.enums';

export class CreateRawWhatsappTemplateDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9_]+$/, {
    message: 'El nombre solo puede llevar minúsculas, números y guion bajo.',
  })
  name: string;

  @IsString()
  @IsOptional()
  language?: string = 'es';

  @IsEnum(WhatsappTemplateCategoryDto)
  category: WhatsappTemplateCategoryDto;

  /**
   * Payload compatible directamente con Meta.
   * Útil para CAROUSEL, MPM, PRODUCT, botones avanzados, etc.
   */
  @IsArray()
  components: Record<string, any>[];

  /**
   * Metadata interna para tu ERP.
   */
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
