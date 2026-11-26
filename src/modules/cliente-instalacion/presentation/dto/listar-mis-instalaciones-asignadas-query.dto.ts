import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { EstadoInstalacionCliente } from '../../domain/enums/estado-instalacion-cliente.enum';

const toNumber = ({ value }: { value: unknown }) => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  return Number(value);
};

export class FiltrarMisInstalacionesAsignadasDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(toNumber)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(toNumber)
  limit?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(EstadoInstalacionCliente)
  estado?: EstadoInstalacionCliente;

  @IsOptional()
  @IsDateString()
  fechaProgramadaDesde?: string;

  @IsOptional()
  @IsDateString()
  fechaProgramadaHasta?: string;
}
