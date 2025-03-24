import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsPhoneNumber,
  IsDate,
  IsInt,
  IsArray,
} from 'class-validator';

export class CreateClienteInternetDto {
  // Datos básicos
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsNotEmpty()
  ip: string;

  @IsString()
  @IsNotEmpty()
  apellidos: string;

  @IsPhoneNumber()
  telefono: string;

  @IsString()
  @IsNotEmpty()
  direccion: string;

  @IsString()
  @IsNotEmpty()
  dpi: string;

  @IsString()
  @IsOptional()
  observaciones?: string;

  @IsString()
  @IsNotEmpty()
  contactoReferenciaNombre: string;

  @IsPhoneNumber()
  contactoReferenciaTelefono: string;

  // Datos del servicio
  @IsString()
  @IsNotEmpty()
  contrasenaWifi: string;

  @IsString()
  @IsNotEmpty()
  ssidRouter: string;

  @IsDate()
  @IsOptional()
  fechaInstalacion: Date | null;

  // Cambié IsUUID() por IsInt para que coincida con el modelo Prisma
  @IsInt()
  asesorId: number;

  //PARA SERVICIOS
  @IsInt()
  @IsArray()
  servicesIds: number[];
  //PARA WIFI
  @IsInt()
  @IsArray()
  servicioWifiId: number;

  @IsInt()
  municipioId: number;

  @IsInt()
  departamentoId: number;

  @IsArray()
  coordenadas: string[];

  @IsInt()
  empresaId: number;

  @IsInt()
  serviceId: number;
  @IsInt()
  zonaFacturacionId: number;

  //DATOS PARA EL CONTRATO
  @IsInt()
  clienteId: number;
  @IsString()
  idContrato: string;
  @IsString()
  fechaFirma: string;
  @IsString()
  archivoContrato: string;
  @IsString()
  observacionesContrato: string;
}
