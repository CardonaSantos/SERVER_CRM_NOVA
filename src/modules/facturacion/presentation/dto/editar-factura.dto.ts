import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsNumber,
  IsString,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

const siLlega = ValidateIf((_, valor) => valor !== undefined);

/** Lo que no llega no cambia. El estado y la fecha pagada salen de los pagos. */
export class EditarFacturaDto {
  /** Monto; no puede ser menor que lo ya pagado */
  @siLlega
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  montoPago?: number;

  /** Descripción */
  @siLlega
  @IsString()
  @MaxLength(500)
  detalleFactura?: string;

  /** Fecha en que debe pagarse (ISO 8601) */
  @siLlega
  @Type(() => Date)
  @IsDate()
  fechaPagoEsperada?: Date;

  /** `true` anula la factura (sin pagos); `false` la reactiva */
  @siLlega
  @IsBoolean()
  anulada?: boolean;
}
