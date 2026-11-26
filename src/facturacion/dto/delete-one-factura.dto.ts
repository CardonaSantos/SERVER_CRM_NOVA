import { IsInt, IsNumber, IsOptional, IsString } from 'class-validator';

export class DeleteFacturaDto {
  /** Id de la factura a eliminar */
  @IsInt()
  facturaId: number;

  /** Usuario que elimina */
  @IsNumber()
  userId: number;

  /** Motivo de la eliminación */
  @IsString()
  motivo: string;

  /** Se acepta pero no se usa */
  @IsOptional()
  @IsString()
  estadoFactura?: string;

  /** Se acepta pero no se usa */
  @IsOptional()
  @IsString()
  fechaEmision?: string;

  /** Se acepta pero no se usa */
  @IsOptional()
  @IsString()
  fechaVencimiento?: string;
}
