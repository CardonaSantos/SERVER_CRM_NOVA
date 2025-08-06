import { MetodoPagoFacturaInternet } from '@prisma/client';
import {
  IsArray,
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateFacturacionPaymentDto {
  @IsString()
  // @IsDate()
  @IsOptional()
  fechaPago: Date | null;

  @IsArray()
  @IsOptional()
  serviciosAdicionales?: number[];

  @IsInt()
  @IsNotEmpty()
  facturaInternetId: number;
  @IsInt()
  @IsNotEmpty()
  clienteId: number;
  @IsInt()
  @IsNotEmpty()
  montoPagado: number;
  @IsInt()
  @IsEnum(MetodoPagoFacturaInternet)
  metodoPago: MetodoPagoFacturaInternet;
  @IsInt()
  @IsNotEmpty()
  cobradorId: number;
  @IsString()
  numeroBoleta: string;
  @IsInt()
  @IsOptional()
  rutaId?: number;
}
