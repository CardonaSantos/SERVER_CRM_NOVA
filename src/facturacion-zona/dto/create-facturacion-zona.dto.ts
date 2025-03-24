import {
  IsString,
  IsInt,
  Min,
  Max,
  IsOptional,
  IsBoolean,
  IsDateString,
} from 'class-validator';

export class CreateFacturacionZonaDto {
  @IsString()
  @IsOptional()
  nombre: string; // Nombre de la zona (Ej: "Jacaltenango Corte 5")

  @IsInt()
  empresaId: number; // ID de la empresa asociada

  @IsInt()
  @Min(1)
  @Max(31)
  diaGeneracionFactura: number; // Día del mes en que se genera la factura (1-31)

  @IsInt()
  @Min(1)
  @Max(31)
  diaPago: number; // Día del mes en que se espera el pago (1-31)

  @IsInt()
  @Min(1)
  @Max(31)
  diaRecordatorio: number; // Día del mes en que se envía el recordatorio (1-31)

  @IsInt()
  @Min(1)
  @Max(31)
  diaSegundoRecordatorio: number; // Día del mes en que se envía el recordatorio (1-31)

  @IsString()
  horaRecordatorio: string; // Hora específica para enviar la notificación (Ej: "08:00:00")

  @IsBoolean()
  @IsOptional()
  enviarRecordatorio?: boolean; // Indica si se enviarán recordatorios. Por defecto es true.

  @IsBoolean()
  whatsapp: boolean;
  @IsBoolean()
  email: boolean;
  @IsBoolean()
  sms: boolean;
  @IsBoolean()
  llamada: boolean;
  @IsBoolean()
  telegram: boolean;

  @IsInt()
  @IsOptional()
  @Min(1)
  diaCorte?: number; // Día del mes en que se corta el servicio si no paga (opcional)

  @IsInt()
  @IsOptional()
  suspenderTrasFacturas?: number; // Cantidad de facturas vencidas antes de cortar servicio (opcional)
  @IsInt()
  zonaFacturacionId: number;
}
