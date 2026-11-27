import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { MetodoPago } from '../../domain/enums/metodo-pago.enum';

/** Datos de todo pago. Quien cobra sale de la sesión. */
export class PagoDto {
  /** Factura que se paga */
  @IsInt()
  @Min(1)
  facturaInternetId: number;

  /** Cliente dueño de la factura */
  @IsInt()
  @Min(1)
  clienteId: number;

  /** Monto en quetzales; no puede superar el saldo */
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  montoPagado: number;

  /** Método de pago */
  @IsEnum(MetodoPago)
  metodoPago: MetodoPago;

  /** Número de boleta o transferencia: requerido en DEPOSITO y único */
  @IsOptional()
  @IsString()
  @MaxLength(100)
  numeroBoleta?: string | null;
}

export class RegistrarPagoDto extends PagoDto {
  /** Fecha del pago (ISO 8601); si no llega, ahora */
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  fechaPago?: Date | null;
}

export class RegistrarPagoRutaDto extends PagoDto {
  /** Ruta de cobro en la que se registra */
  @IsInt()
  @Min(1)
  rutaId: number;
}
