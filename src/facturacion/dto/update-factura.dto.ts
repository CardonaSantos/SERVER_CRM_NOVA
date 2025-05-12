import { EstadoFacturaInternet, StateFacturaInternet } from '@prisma/client';
import { IsNumber, IsOptional, IsDateString, IsEnum } from 'class-validator';

export class UpdateFacturaDto {
  @IsOptional()
  @IsNumber()
  montoPago?: number;

  @IsOptional()
  @IsNumber()
  saldoPendiente?: number;

  @IsOptional()
  @IsDateString()
  fechaPagada?: string;

  @IsOptional()
  @IsDateString()
  fechaPagoEsperada?: string;

  @IsOptional()
  @IsEnum(StateFacturaInternet)
  estadoFacturaInternet?: StateFacturaInternet;

  @IsOptional()
  detalleFactura?: string;
}
