import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CrearPerfilHomologacionDto {
  /** Router MikroTik donde existe el profile. */
  @Type(() => Number)
  @IsInt()
  @Min(1)
  mikrotikRouterId: number;

  /** Servicio de internet que se homologa con el profile. */
  @Type(() => Number)
  @IsInt()
  @Min(1)
  servicioInternetId: number;

  /** Nombre exacto del profile en MikroTik. */
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  codigoPerfil: string;

  /** Ignorado: la empresa sale de la sesión. Se acepta por compatibilidad. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  empresaId?: number;

  /** Ignorado: el autor sale de la sesión. Se acepta por compatibilidad. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  creadoPorId?: number;
}
