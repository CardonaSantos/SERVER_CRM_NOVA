import {
  IsInt,
  IsOptional,
  IsString,
  IsNumber,
  IsDateString,
} from 'class-validator';

export class CreateFacturaEliminacionDto {
  @IsOptional()
  @IsInt()
  id?: number; // Solo en respuestas

  @IsOptional()
  @IsInt()
  facturaInternetId?: number | null;

  @IsString()
  periodo: string;

  @IsNumber()
  montoPago: number;

  @IsDateString()
  fechaPagoEsperada: string; // ISO format

  @IsInt()
  clienteId: number;

  @IsInt()
  usuarioId: number;

  @IsOptional()
  @IsDateString()
  fechaEliminacion?: string;
}

// export class CreateFacturaEliminacionDto {}
