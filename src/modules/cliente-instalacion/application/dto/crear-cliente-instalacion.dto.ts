import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { TipoInstalacionCliente } from '../../domain/enums/tipo-instalacion-cliente.enum';

export class CrearClienteInstalacionDto {
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
  asesorId?: number;

  @IsOptional()
  @IsEnum(TipoInstalacionCliente)
  tipo?: TipoInstalacionCliente;

  @IsOptional()
  @IsDateString()
  fechaProgramada?: string;

  @IsOptional()
  @IsString()
  direccionInstalacion?: string;

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
}
