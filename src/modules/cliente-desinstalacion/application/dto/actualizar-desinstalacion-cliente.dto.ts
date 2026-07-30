import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { MotivoDesinstalacionCliente } from '../../domain/enums/motivo-desinstalacion-cliente.enum';
import { TipoDesinstalacionCliente } from '../../domain/enums/tipo-desinstalacion-cliente.enum';
import { Type } from 'class-transformer';

export class ActualizarClienteDesinstalacionDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  accesoInternetId?: number | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  servicioInternetId?: number | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  ticketId?: number | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  solicitadoPorId?: number | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  ejecutadoPorId?: number | null;

  @IsOptional()
  @IsEnum(TipoDesinstalacionCliente)
  tipo?: TipoDesinstalacionCliente;

  @IsOptional()
  @IsEnum(MotivoDesinstalacionCliente)
  motivo?: MotivoDesinstalacionCliente | null;

  @IsOptional()
  @IsDateString()
  fechaProgramada?: string | null;

  @IsOptional()
  @IsBoolean()
  requiereRetiroEquipo?: boolean;

  @IsOptional()
  @IsString()
  direccionServicio?: string | null;

  @IsOptional()
  @IsString()
  referenciaUbicacion?: string | null;

  @IsOptional()
  @IsNumber()
  latitud?: number | null;

  @IsOptional()
  @IsNumber()
  longitud?: number | null;

  @IsOptional()
  @IsString()
  observaciones?: string | null;
}
