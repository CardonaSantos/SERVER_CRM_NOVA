import { Type } from 'class-transformer';

import {
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

export class RegistrarUbicacionTecnicoDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  sesionTrackingId: number;

  @Type(() => Number)
  @IsNumber({
    allowNaN: false,
    allowInfinity: false,
  })
  @Min(-90)
  @Max(90)
  latitud: number;

  @Type(() => Number)
  @IsNumber({
    allowNaN: false,
    allowInfinity: false,
  })
  @Min(-180)
  @Max(180)
  longitud: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({
    allowNaN: false,
    allowInfinity: false,
  })
  @Min(0)
  precision?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({
    allowNaN: false,
    allowInfinity: false,
  })
  @Min(0)
  velocidad?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  bateria?: number | null;

  /**
   * Instante capturado por el dispositivo.
   *
   * El backend NO lo utiliza como heartbeat.
   */
  @IsDateString()
  capturadoEn: string;
}
