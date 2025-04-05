import { MetodoPagoFacturaInternet } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateFacturacionPaymentDto {
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
