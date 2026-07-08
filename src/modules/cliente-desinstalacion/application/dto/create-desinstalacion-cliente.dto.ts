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

  /**
   * Este campo sirve si al crear la desinstalación también quieres
   * crear una autorización pendiente.
   */
  @IsOptional()
  @IsString()
  motivoSolicitudAutorizacion?: string;
}
