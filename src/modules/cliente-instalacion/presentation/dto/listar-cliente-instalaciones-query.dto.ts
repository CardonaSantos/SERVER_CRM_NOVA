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
import { TipoInstalacionCliente } from '../../domain/enums/tipo-instalacion-cliente.enum';

const toNumber = ({ value }: { value: unknown }) => {
  if (value === undefined || value === null || value === '') return undefined;
  return Number(value);
};

export class FiltrarClienteInstalacionesDto {
  @IsInt()
  @Min(1)
  @Transform(toNumber)
  empresaId: number;

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
  @IsInt()
  @Min(1)
  @Transform(toNumber)
  clienteId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(toNumber)
  servicioInternetId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(toNumber)
  ticketId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(toNumber)
  asesorId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(toNumber)
  creadoPorId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(toNumber)
  completadoPorId?: number;

  @IsOptional()
  @IsEnum(EstadoInstalacionCliente)
  estado?: EstadoInstalacionCliente;

  @IsOptional()
  @IsEnum(TipoInstalacionCliente)
  tipo?: TipoInstalacionCliente;

  @IsOptional()
  @IsDateString()
  fechaProgramadaDesde?: string;

  @IsOptional()
  @IsDateString()
  fechaProgramadaHasta?: string;

  @IsOptional()
  @IsDateString()
  fechaFinalizacionDesde?: string;

  @IsOptional()
  @IsDateString()
  fechaFinalizacionHasta?: string;
}
