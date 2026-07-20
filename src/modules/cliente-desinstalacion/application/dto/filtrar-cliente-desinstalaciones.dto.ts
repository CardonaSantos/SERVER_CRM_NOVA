import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { EstadoDesinstalacionCliente } from '../../domain/enums/estado-desinstalacion-cliente.enum';
import { MotivoDesinstalacionCliente } from '../../domain/enums/motivo-desinstalacion-cliente.enum';
import { TipoDesinstalacionCliente } from '../../domain/enums/tipo-desinstalacion-cliente.enum';

const toNumber = ({ value }: { value: unknown }) => {
  if (value === undefined || value === null || value === '') return undefined;
  return Number(value);
};

export class FiltrarClienteDesinstalacionesDto {
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
  @IsInt()
  @Min(1)
  @Transform(toNumber)
  empresaId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(toNumber)
  clienteId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(toNumber)
  solicitadoPorId?: number;

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
  ejecutadoPorId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(toNumber)
  creadoPorId?: number;

  @IsOptional()
  @IsEnum(EstadoDesinstalacionCliente)
  estado?: EstadoDesinstalacionCliente;

  @IsOptional()
  @IsEnum(TipoDesinstalacionCliente)
  tipo?: TipoDesinstalacionCliente;

  @IsOptional()
  @IsEnum(MotivoDesinstalacionCliente)
  motivo?: MotivoDesinstalacionCliente;

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

  @IsOptional()
  @IsString()
  search?: string;
}
