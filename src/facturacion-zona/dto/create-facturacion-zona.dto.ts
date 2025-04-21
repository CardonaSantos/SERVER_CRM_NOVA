import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
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
  diaGeneracionFactura: number;

  @IsBoolean()
  enviarRecordatorioGeneracion: boolean;

  @IsInt()
  @Min(1)
  @Max(31)
  diaPago: number;

  @IsBoolean()
  enviarAvisoPago: boolean;

  @IsInt()
  @Min(1)
  @Max(31)
  diaRecordatorio: number;

  @IsBoolean()
  enviarRecordatorio1: boolean;

  @IsInt()
  @Min(1)
  @Max(31)
  diaSegundoRecordatorio: number;

  @IsBoolean()
  enviarRecordatorio2: boolean;

  @IsString()
  horaRecordatorio: string;

  @IsBoolean()
  enviarRecordatorio: boolean;

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
  diaCorte?: number;

  @IsInt()
  @IsOptional()
  suspenderTrasFacturas?: number;
}
