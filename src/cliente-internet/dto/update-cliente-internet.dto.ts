import { EstadoCliente, EstadoCobranzaCliente } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsDate,
  IsInt,
  IsArray,
  IsEnum,
  IsBoolean,
} from 'class-validator';

/** Edición de un cliente: lo que no llega no se modifica. */
export class UpdateClienteInternetDto {
  /** Se acepta pero no se usa: el id sale de la ruta */
  @IsOptional()
  @IsInt()
  id?: number;

  // Datos básicos

  /** Nombres del cliente */
  @IsString()
  @IsNotEmpty()
  nombre: string;

  /** Recibir recordatorios de pago */
  @IsOptional()
  @IsBoolean()
  enviarRecordatorio?: boolean;

  /** Estado operativo */
  @IsOptional()
  @IsEnum(EstadoCliente)
  estado?: EstadoCliente;

  /** Se acepta pero se ignora: la cobranza sale de las facturas. */
  @IsOptional()
  @IsEnum(EstadoCobranzaCliente)
  estadoCobranza?: EstadoCobranzaCliente;

  /** Sector */
  @IsOptional()
  @IsInt()
  sectorId?: number;

  /** Router asignado; null lo desvincula */
  @IsOptional()
  @IsInt()
  mikrotikRouterId?: number | null;

  /** IP asignada */
  @IsOptional()
  @IsString()
  ip?: string;

  /** Puerta de enlace */
  @IsOptional()
  @IsString()
  gateway?: string;

  /** Máscara de red */
  @IsOptional()
  @IsString()
  mascara?: string;

  /** Apellidos */
  @IsOptional()
  @IsString()
  apellidos?: string;

  /** Teléfono tal como se escribe en el formulario */
  @IsOptional()
  @IsString()
  telefono?: string;

  /** Dirección */
  @IsOptional()
  @IsString()
  direccion?: string;

  /** Documento de identificación */
  @IsOptional()
  @IsString()
  dpi?: string;

  /** Observaciones */
  @IsOptional()
  @IsString()
  observaciones?: string;

  /** Nombre del contacto de referencia */
  @IsOptional()
  @IsString()
  contactoReferenciaNombre?: string;

  /** Teléfono del contacto de referencia */
  @IsOptional()
  @IsString()
  contactoReferenciaTelefono?: string;

  // Datos del servicio

  /** Contraseña WiFi del router del cliente */
  @IsOptional()
  @IsString()
  contrasenaWifi?: string;

  /** Nombre de la red WiFi */
  @IsOptional()
  @IsString()
  ssidRouter?: string;

  /** Fecha de instalación (ISO 8601); null la borra */
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  fechaInstalacion?: Date | null;

  /** Asesor */
  @IsOptional()
  @IsInt()
  asesorId?: number;

  /** Servicios adicionales; reemplaza la lista solo si llega */
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  servicesIds?: number[];

  /** Plan de internet */
  @IsOptional()
  @IsInt()
  servicioWifiId?: number;

  /** Municipio */
  @IsOptional()
  @IsInt()
  municipioId?: number;

  /** Departamento */
  @IsOptional()
  @IsInt()
  departamentoId?: number;

  /** Latitud y longitud */
  @IsOptional()
  @IsArray()
  coordenadas?: string[];

  /** Empresa */
  @IsInt()
  empresaId: number;

  /** Se acepta pero no se usa */
  @IsOptional()
  @IsInt()
  serviceId?: number;

  /** Zona de facturación */
  @IsOptional()
  @IsInt()
  zonaFacturacionId?: number;

  //DATOS PARA EL CONTRATO

  /** Número de contrato; si va vacío el contrato no se toca */
  @IsOptional()
  @IsString()
  idContrato?: string;

  /** Fecha de firma (ISO 8601) */
  @IsOptional()
  @IsString()
  fechaFirma?: string;

  /** Archivo del contrato */
  @IsOptional()
  @IsString()
  archivoContrato?: string;

  /** Observaciones del contrato */
  @IsOptional()
  @IsString()
  observacionesContrato?: string;
}
