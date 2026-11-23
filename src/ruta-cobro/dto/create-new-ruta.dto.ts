import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

/** POST /ruta-cobro (validadores: etapa 8; alineado con CrearRutaDTO del front). */
export class CreateNewRutaDto {
  @IsInt()
  @IsPositive()
  empresaId: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nombreRuta: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  observaciones?: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  cobradorId?: number;

  /** El front actual no lo envía; se acepta por compatibilidad. */
  @IsOptional()
  @IsInt()
  @IsPositive()
  asignadoPor?: number;

  @IsArray()
  @IsInt({ each: true })
  clientesIds: number[];
}
