import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  WhatsappTemplateButtonTypeDto,
  WhatsappTemplateCategoryDto,
  WhatsappTemplateComponentTypeDto,
  WhatsappTemplateHeaderFormatDto,
} from './meta-template.enums';

export class WhatsappTemplateExampleDto {
  @IsOptional()
  @IsArray()
  body_text?: string[][];

  @IsOptional()
  @IsArray()
  header_text?: string[];

  /**
   * Necesario para HEADER con IMAGE, VIDEO o DOCUMENT.
   * Meta espera:
   * example: {
   *   header_handle: ["4::..."]
   * }
   */
  @IsOptional()
  @IsArray()
  header_handle?: string[];
}

export class WhatsappTemplateButtonDto {
  @IsEnum(WhatsappTemplateButtonTypeDto)
  type: WhatsappTemplateButtonTypeDto;

  @IsString()
  @IsNotEmpty()
  text: string;

  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsString()
  phone_number?: string;

  @IsOptional()
  @IsString()
  example?: string;
}

export class WhatsappTemplateComponentDto {
  @IsEnum(WhatsappTemplateComponentTypeDto)
  type: WhatsappTemplateComponentTypeDto;

  @IsOptional()
  @IsEnum(WhatsappTemplateHeaderFormatDto)
  format?: WhatsappTemplateHeaderFormatDto;

  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => WhatsappTemplateExampleDto)
  example?: WhatsappTemplateExampleDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WhatsappTemplateButtonDto)
  buttons?: WhatsappTemplateButtonDto[];
}

export class CreateWhatsappTemplateDto {
  /**
   * Meta pide nombres en minúsculas, números y guion bajo.
   * Ejemplo: oferta_internet_junio
   */
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9_]+$/, {
    message: 'El nombre solo puede llevar minúsculas, números y guion bajo.',
  })
  name: string;

  /**
   * Normalmente: es, es_GT, en_US, etc.
   */
  @IsString()
  @IsOptional()
  language?: string = 'es';

  @IsEnum(WhatsappTemplateCategoryDto)
  category: WhatsappTemplateCategoryDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WhatsappTemplateComponentDto)
  components: WhatsappTemplateComponentDto[];
}
