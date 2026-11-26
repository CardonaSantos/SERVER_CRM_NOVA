import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { EstadoOperativoCliente } from '../../domain/enums/estado-operativo-cliente.enum';

const ESTADOS_DE_ALTA = [
  EstadoOperativoCliente.ACTIVO,
  EstadoOperativoCliente.PENDIENTE_ACTIVO,
  EstadoOperativoCliente.EN_INSTALACION,
] as const;

export class CrearClienteDto {
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
  @IsIn(ESTADOS_DE_ALTA)
  estado?: (typeof ESTADOS_DE_ALTA)[number];

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

  /** Empresa */
  @IsInt()
  empresaId: number;

  /** Zona de facturación */
  @IsInt()
  zonaFacturacionId: number;

  /** Plan de internet */
  @IsInt()
  servicioWifiId: number;

  /** Municipio */
  @IsInt()
  municipioId: number;

  /** Departamento */
  @IsInt()
  departamentoId: number;

  /** Sector */
  @IsOptional()
  @IsInt()
  sectorId?: number;

  /** Asesor */
  @IsOptional()
  @IsInt()
  asesorId?: number;

  /** Router asignado */
  @IsOptional()
  @IsInt()
  mkSelected?: number;

  /** Servicios adicionales contratados */
  @IsArray()
  @IsInt({ each: true })
  servicesIds: number[];

  /** Latitud y longitud, como texto */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  coordenadas?: string[];

  /** Número de contrato; si va vacío no se crea contrato */
  @IsOptional()
  @IsString()
  idContrato?: string;

  /** Fecha de firma (ISO 8601) */
  @Transform(({ value }) => value || undefined)
  @IsOptional()
  @IsDateString()
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
