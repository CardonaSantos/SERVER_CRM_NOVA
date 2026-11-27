import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
} from 'class-validator';
import { Recortar } from 'src/common/http/transformaciones-query';

export class EnviarCampaniaDto {
  /** Nombre de la plantilla aprobada */
  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  plantilla: string;

  /** Idioma de la plantilla */
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  idioma: string;

  /** Clientes destinatarios; el servidor busca sus teléfonos */
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(2000)
  @IsInt({ each: true })
  @Min(1, { each: true })
  clienteIds: number[];

  /** Imagen pública (https), solo si la plantilla la lleva */
  @IsOptional()
  @Recortar()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  @MaxLength(2000)
  imagenUrl?: string;
}
