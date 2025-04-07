import { IsString, IsUUID } from 'class-validator';

export class DeleteFacturaDto {
  @IsUUID()
  facturaId: number;

  @IsString()
  estadoFactura: string;

  @IsString()
  fechaEmision: string;

  @IsString()
  fechaVencimiento: string;
}
