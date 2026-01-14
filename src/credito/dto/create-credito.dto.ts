import {
  IsInt,
  IsPositive,
  IsString,
  IsEnum,
  IsOptional,
  IsDateString,
  Min,
} from 'class-validator';
import { FrecuenciaPago, InteresTipo, OrigenCredito } from '@prisma/client';

export class CrearCreditoDto {
  @IsInt()
  @IsPositive()
  clienteId: number;

  @IsString()
  montoCapital: string;

  @IsString()
  interesPorcentaje: string;

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

  @IsEnum(OrigenCredito)
  @IsOptional()
  origenCredito?: OrigenCredito;

  @IsString()
  @IsOptional()
  observaciones?: string;
}
