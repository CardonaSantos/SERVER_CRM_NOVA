import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

export class CreateUtilityImageTemplateDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9_]+$/, {
    message: 'El nombre solo puede usar minúsculas, números y guion bajo.',
  })
  name: string;

  @IsString()
  @IsOptional()
  language?: string = 'es';

  /**
   * Handle devuelto por /media-handle.
   * Ejemplo: "4::aW..."
   */
  @IsOptional()
  @IsString()
  headerHandle?: string;

  /**
   * Texto principal.
   * Puede llevar variables:
   * "Hola {{1}}, tu pago de {{2}} vence el {{3}}."
   */
  @IsString()
  @IsNotEmpty()
  bodyText: string;

  /**
   * Ejemplos para las variables del body.
   * Ejemplo:
   * [["Carlos", "Q150", "30/06/2026"]]
   */
  @IsArray()
  bodyExample: string[][];

  @IsOptional()
  @IsString()
  footerText?: string;
}
