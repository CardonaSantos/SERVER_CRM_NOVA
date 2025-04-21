// DTOs
import {
  IsInt,
  IsOptional,
  IsString,
  IsDateString,
  IsNumber,
} from 'class-validator';

export class CreateContratoClienteDto {
  @IsInt()
  clienteId: number;

  @IsOptional()
  @IsDateString()
  fechaInstalacionProgramada?: string;

  @IsOptional()
  @IsNumber()
  costoInstalacion?: number;

  @IsOptional()
  @IsDateString()
  fechaPago?: string;

  @IsOptional()
  @IsString()
  observaciones?: string;

  @IsOptional()
  @IsString()
  ssid?: string;

  @IsOptional()
  @IsString()
  wifiPassword?: string;

  @IsOptional()
  @IsInt()
  plantillaId?: number;
}
