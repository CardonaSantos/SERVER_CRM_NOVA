import { EstadoCliente } from '@prisma/client';
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

export class CreateClienteInternetDto {
  // Datos básicos

  /** Nombres del cliente */
  @IsString()
  @IsNotEmpty()
  nombre: string;

  /** Apellidos */
  @IsOptional()
  @IsString()
  apellidos?: string;

  /** Estado operativo inicial; por defecto ACTIVO */
  @IsOptional()
  @IsEnum(EstadoCliente)
  estado?: EstadoCliente;

  /** IP asignada (puede ir vacía) */
  @IsString()
  ip: string;

  /** Puerta de enlace */
  @IsOptional()
  @IsString()
  gateway?: string;

  /** Máscara de red */
  @IsOptional()
  @IsString()
  mascara?: string;

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

  /** Sector */
  @IsOptional()
  @IsInt()
  sectorId?: number;

  // Datos del servicio

  /** Contraseña WiFi del router del cliente */
  @IsOptional()
  @IsString()
  contrasenaWifi?: string;

  /** Nombre de la red WiFi */
  @IsOptional()
  @IsString()
  ssidRouter?: string;

  /** Fecha de instalación (ISO 8601) */
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  fechaInstalacion?: Date | null;

  /** Asesor */
  @IsOptional()
  @IsInt()
  asesorId?: number;

  /** Servicios adicionales contratados */
  @IsArray()
  @IsInt({ each: true })
  servicesIds: number[];

  /** Plan de internet */
  @IsInt()
  servicioWifiId: number;

  /** Municipio */
  @IsInt()
  municipioId: number;

  /** Departamento */
  @IsInt()
  departamentoId: number;

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
  @IsInt()
  zonaFacturacionId: number;

  /** Se acepta pero no se usa */
  @IsOptional()
  @IsInt()
  userId?: number;

  /** Router asignado */
  @IsOptional()
  @IsInt()
  mkSelected?: number;

  /** Se acepta pero se ignora: el control del router es solo por PPPoE. */
  @IsOptional()
  @IsBoolean()
  activateOnMk?: boolean;

  //DATOS PARA EL CONTRATO

  /** Se acepta pero no se usa */
  @IsOptional()
  @IsInt()
  clienteId?: number;

  /** Número de contrato; si va vacío no se crea contrato */
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
