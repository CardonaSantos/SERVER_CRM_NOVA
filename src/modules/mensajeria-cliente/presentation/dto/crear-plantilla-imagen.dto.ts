import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

export class CrearPlantillaImagenDto {
  /** Minúsculas, números y guion bajo */
  @IsString()
  @Matches(/^[a-z0-9_]+$/, {
    message: 'El nombre solo puede llevar minúsculas, números y guion bajo.',
  })
  name: string;

  /** Idioma. Por defecto es */
  @IsOptional()
  @IsString()
  language?: string;

  /** Identificador devuelto por `media-handle` */
  @IsOptional()
  @IsString()
  headerHandle?: string;

  /** Texto principal; admite variables {{1}} */
  @IsString()
  @IsNotEmpty()
  bodyText: string;

  /** Ejemplos de las variables: [["Ana", "Q150"]] */
  @IsArray()
  bodyExample: string[][];

  /** Pie de la plantilla */
  @IsOptional()
  @IsString()
  footerText?: string;
}
