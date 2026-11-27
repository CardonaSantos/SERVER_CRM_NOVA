import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  ValidateNested,
} from 'class-validator';
import {
  CategoriaPlantilla,
  FormatoEncabezado,
  TipoBotonPlantilla,
  TipoComponentePlantilla,
} from '../../domain/enums/plantilla.enum';

export class EjemploComponenteDto {
  /** Ejemplos de las variables del cuerpo: [["Ana", "Q150"]] */
  @IsOptional()
  @IsArray()
  body_text?: string[][];

  /** Ejemplos de las variables del encabezado */
  @IsOptional()
  @IsArray()
  header_text?: string[];

  /** Identificador de la imagen subida (`media-handle`) */
  @IsOptional()
  @IsArray()
  header_handle?: string[];
}

export class BotonPlantillaDto {
  /** Tipo de botón */
  @IsEnum(TipoBotonPlantilla)
  type: TipoBotonPlantilla;

  /** Texto visible */
  @IsString()
  @IsNotEmpty()
  text: string;

  /** Dirección (botón URL) */
  @IsOptional()
  @IsString()
  url?: string;

  /** Teléfono (botón de llamada) */
  @IsOptional()
  @IsString()
  phone_number?: string;

  /** Ejemplo del botón */
  @IsOptional()
  @IsString()
  example?: string;
}

export class ComponentePlantillaDto {
  /** Parte de la plantilla */
  @IsEnum(TipoComponentePlantilla)
  type: TipoComponentePlantilla;

  /** Formato del encabezado */
  @IsOptional()
  @IsEnum(FormatoEncabezado)
  format?: FormatoEncabezado;

  /** Texto, con variables {{1}} si las usa */
  @IsOptional()
  @IsString()
  text?: string;

  /** Ejemplos que pide WhatsApp */
  @IsOptional()
  @ValidateNested()
  @Type(() => EjemploComponenteDto)
  example?: EjemploComponenteDto;

  /** Botones */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BotonPlantillaDto)
  buttons?: BotonPlantillaDto[];
}

export class CrearPlantillaDto {
  /** Minúsculas, números y guion bajo */
  @IsString()
  @Matches(/^[a-z0-9_]+$/, {
    message: 'El nombre solo puede llevar minúsculas, números y guion bajo.',
  })
  name: string;

  /** Idioma (es, es_GT…). Por defecto es */
  @IsOptional()
  @IsString()
  language?: string;

  /** Categoría de WhatsApp */
  @IsEnum(CategoriaPlantilla)
  category: CategoriaPlantilla;

  /** Partes de la plantilla */
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ComponentePlantillaDto)
  components: ComponentePlantillaDto[];
}
