import {
  IsInt,
  IsPositive,
  IsString,
  IsEnum,
  IsOptional,
  IsDateString,
  Min,
  IsArray,
  ValidateNested,
  IsIn,
} from 'class-validator';
import { FrecuenciaPago, InteresTipo, OrigenCredito } from '@prisma/client';
import { Type } from 'class-transformer';

export class CrearCreditoDto {
  @IsInt()
  @IsPositive()
  clienteId: number;

  @IsString()
  montoCapital: string;

  @IsString()
  interesPorcentaje: string;

  @IsString()
  interesMoraPorcentaje: string;

  @IsEnum(InteresTipo)
  interesTipo: InteresTipo;

  @IsInt()
  @Min(1)
  plazoCuotas: number;

  @IsEnum(FrecuenciaPago)
  frecuencia: FrecuenciaPago;

  @IsInt()
  @Min(1)
  intervaloDias: number;

  @IsDateString()
  fechaInicio: Date;

  @IsInt()
  @IsPositive()
  creadoPorId: number;

  // --- NUEVOS CAMPOS ---

  @IsString() // O usa @IsEnum si creas un enum en backend para esto
  @IsIn(['AUTOMATICA', 'CUSTOM'])
  tipoGeneracionCuotas: 'AUTOMATICA' | 'CUSTOM';

  @IsString()
  @IsOptional()
  engancheMonto?: string;

  @IsDateString()
  @IsOptional()
  engancheFecha?: string;

  @IsArray()
  @ValidateNested({ each: true }) // Valida cada objeto dentro del array
  @Type(() => CuotaCustomDto) // Transforma el JSON plano a instancias de CuotaCustomDto
  @IsOptional()
  cuotasCustom?: CuotaCustomDto[];

  @IsEnum(OrigenCredito)
  @IsOptional()
  origenCredito?: OrigenCredito;

  @IsString()
  @IsOptional()
  observaciones?: string;
}

export class CuotaCustomDto {
  @IsInt()
  @IsPositive()
  numeroCuota: number;

  @IsDateString()
  fechaVencimiento: string; // El JSON lo envía como string ISO

  @IsString()
  montoCapital: string;

  @IsString()
  @IsOptional()
  montoInteres: string;
}
