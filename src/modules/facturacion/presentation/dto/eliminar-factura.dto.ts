import { IsInt, IsNotEmpty, IsString, MaxLength, Min } from 'class-validator';
import { Recortar } from 'src/common/http/transformaciones-query';

export class EliminarPagoDto {
  /** Por qué se elimina; queda en la bitácora */
  @Recortar()
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  motivo: string;
}

export class EliminarFacturaDto extends EliminarPagoDto {
  /** Factura a eliminar (sin pagos) */
  @IsInt()
  @Min(1)
  facturaId: number;
}
