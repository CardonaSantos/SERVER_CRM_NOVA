import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { TipoArchivoCliente } from '@prisma/client';
import { ClienteReferenciaDto } from './dto-referencias.dto';

class ReferenciaDto {
  @IsString()
  nombre: string;

  @IsString()
  telefono: string;

  @IsString()
  relacion: string;
}

export class UploadArchivosDto {
  @IsOptional()
  @IsString()
  fuenteIngresos?: string;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  tieneDeudas?: boolean;

  @IsOptional()
  @IsString()
  detalleDeudas?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return [];
      }
    }
    return value;
  })
  @ValidateNested({ each: true })
  @Type(() => ReferenciaDto) // 👈 CRÍTICO
  referencias?: ReferenciaDto[];

  @IsArray()
  @IsEnum(TipoArchivoCliente, { each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  tipos: TipoArchivoCliente[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) =>
    !value ? [] : Array.isArray(value) ? value : [value],
  )
  descripciones: string[] = [];
}
