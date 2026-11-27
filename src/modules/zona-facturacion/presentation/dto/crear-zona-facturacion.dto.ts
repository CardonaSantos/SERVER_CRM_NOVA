import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Recortar } from 'src/common/http/transformaciones-query';

export class CrearZonaFacturacionDto {
  /** Nombre visible de la zona */
  @Recortar()
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  nombre: string;

  /** Día del mes en que se generan las facturas */
  @IsInt()
  @Min(1)
  @Max(31)
  diaGeneracionFactura: number;

  /** Día de pago */
  @IsInt()
  @Min(1)
  @Max(31)
  diaPago: number;

  /** Día del primer recordatorio */
  @IsInt()
  @Min(1)
  @Max(31)
  diaRecordatorio: number;

  /** Día del segundo recordatorio */
  @IsInt()
  @Min(1)
  @Max(31)
  diaSegundoRecordatorio: number;

  /** Día de corte; `null` lo quita */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  diaCorte?: number | null;

  /** Facturas vencidas para suspender; `null` lo quita */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  suspenderTrasFacturas?: number | null;

  /** Interruptor general de avisos */
  @IsBoolean()
  enviarRecordatorio: boolean;

  /** Aviso al generar la factura */
  @IsBoolean()
  enviarRecordatorioGeneracion: boolean;

  /** Aviso el día de pago */
  @IsBoolean()
  enviarAvisoPago: boolean;

  /** Primer recordatorio */
  @IsBoolean()
  enviarRecordatorio1: boolean;

  /** Segundo recordatorio */
  @IsBoolean()
  enviarRecordatorio2: boolean;
}
