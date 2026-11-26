import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { RolTecnicoOperacionCliente } from '../../domain/enums/rol-tecnico-operacion-cliente.enum';

export class AsignarTecnicoInstalacionDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  tecnicoId: number;

  @IsOptional()
  @IsEnum(RolTecnicoOperacionCliente)
  rol?: RolTecnicoOperacionCliente;

  @IsOptional()
  @IsBoolean()
  esResponsable?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  observaciones?: string | null;
}
