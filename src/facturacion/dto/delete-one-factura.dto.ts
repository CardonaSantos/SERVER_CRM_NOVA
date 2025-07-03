import { IsNumber, IsString, IsUUID } from 'class-validator';

export class DeleteFacturaDto {
  @IsUUID()
  facturaId: number;

  @IsNumber()
  userId: number;

  @IsString()
  estadoFactura: string;

  @IsString()
  fechaEmision: string;

  @IsString()
  fechaVencimiento: string;

  @IsString()
  motivo: string;
}
