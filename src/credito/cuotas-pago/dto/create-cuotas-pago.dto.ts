import { Transform, Type } from 'class-transformer';
import {
  IsInt,
  IsNumber,
  IsDateString,
  IsString,
  IsOptional,
} from 'class-validator';

export class CreateCuotasPagoDto {
  @Type(() => Number)
  @IsInt()
  cuotaId: number;

  //   @Transform(({ value }) => Number(value))
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  monto: number;

  @Type(() => Number)
  @IsInt()
  creditoId: number;

  @IsOptional()
  @IsString()
  fechaPago?: string;

  @IsString()
  metodoPago: string;

  @IsOptional()
  @IsString()
  referencia?: string;

  @IsOptional()
  @IsString()
  observacion?: string;
}
