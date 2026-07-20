import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { MotivoDesinstalacionCliente } from '../../domain/enums/motivo-desinstalacion-cliente.enum';
import { TipoDesinstalacionCliente } from '../../domain/enums/tipo-desinstalacion-cliente.enum';
import { AsignarTecnicoDesinstalacionDto } from './tecnico-desinstalacion.dto';

export class CrearClienteDesinstalacionDto {
  @IsInt()
  @Min(1)
  empresaId: number;

  @IsInt()
  @Min(1)
  clienteId: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  servicioInternetId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  ticketId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  solicitadoPorId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  ejecutadoPorId?: number;

  @IsOptional()
  @IsEnum(TipoDesinstalacionCliente)
  tipo?: TipoDesinstalacionCliente;

  @IsOptional()
  @IsEnum(MotivoDesinstalacionCliente)
  motivo?: MotivoDesinstalacionCliente;

  @IsOptional()
  @IsDateString()
  fechaSolicitud?: string;

  @IsOptional()
  @IsDateString()
  fechaProgramada?: string;

  @IsOptional()
  @IsBoolean()
  requiereRetiroEquipo?: boolean;

  @IsOptional()
  @IsNumber()
  saldoClienteAlMomento?: number;

  @IsOptional()
  @IsString()
  direccionServicio?: string;

  @IsOptional()
  @IsString()
  referenciaUbicacion?: string;

  @IsOptional()
  @IsNumber()
  latitud?: number;

  @IsOptional()
  @IsNumber()
  longitud?: number;

  @IsOptional()
  @IsString()
  observaciones?: string;

  @IsOptional()
  @IsString()
  motivoSolicitudAutorizacion?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AsignarTecnicoDesinstalacionDto)
  tecnicos?: AsignarTecnicoDesinstalacionDto[];
}
