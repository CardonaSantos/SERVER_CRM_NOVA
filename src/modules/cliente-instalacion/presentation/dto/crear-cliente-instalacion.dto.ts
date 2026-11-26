import { Transform, Type } from 'class-transformer';

import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsDateString,
  IsDefined,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { EstadoInstalacionCliente } from '../../domain/enums/estado-instalacion-cliente.enum';
import { TipoInstalacionCliente } from '../../domain/enums/tipo-instalacion-cliente.enum';
import { AsignarTecnicoInstalacionDto } from './asignar-tecnico-instalacion.dto';
import { CrearClienteInstalacionCostosDto } from './crear-instalacion-costos.dto';
import {
  AccesoInstalacionBaseDto,
  CrearAccesoNuevoInstalacionDto,
  VincularAccesoExistenteInstalacionDto,
} from './acceso-instalacion.dto';
import { ModoAccesoInstalacion } from '../../domain/enums/modo-acceso-instalacion.enum';

const toNumber = ({ value }: { value: unknown }) => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  return Number(value);
};

const toOptionalTrimmedString = ({ value }: { value: unknown }) => {
  if (value === undefined || value === null) {
    return undefined;
  }

  const normalized = String(value).trim();

  return normalized === '' ? undefined : normalized;
};

export class CrearClienteInstalacionDto {
  /** Se ignora: la empresa sale del usuario autenticado. Se conserva para no romper a quien aún la envía. */
  @IsOptional()
  @Transform(toNumber)
  @IsInt()
  @Min(1)
  empresaId?: number;

  @Transform(toNumber)
  @IsInt()
  @Min(1)
  clienteId: number;

  @IsOptional()
  @Transform(toNumber)
  @IsInt()
  @Min(1)
  servicioInternetId?: number;

  @IsOptional()
  @Transform(toNumber)
  @IsInt()
  @Min(1)
  ticketId?: number;

  @IsOptional()
  @Transform(toNumber)
  @IsInt()
  @Min(1)
  asesorId?: number;

  /*
   * Acceso de internet
   */

  @IsDefined({
    message: 'La configuración de acceso de internet es obligatoria.',
  })
  @ValidateNested()
  @Type(() => AccesoInstalacionBaseDto, {
    discriminator: {
      property: 'modo',

      subTypes: [
        {
          name: ModoAccesoInstalacion.NUEVO,

          value: CrearAccesoNuevoInstalacionDto,
        },
        {
          name: ModoAccesoInstalacion.EXISTENTE,

          value: VincularAccesoExistenteInstalacionDto,
        },
      ],
    },

    keepDiscriminatorProperty: true,
  })
  acceso:
    | CrearAccesoNuevoInstalacionDto
    | VincularAccesoExistenteInstalacionDto;

  /*
   * Clasificación y estado inicial
   */

  @IsOptional()
  @IsEnum(TipoInstalacionCliente)
  tipo?: TipoInstalacionCliente;

  @IsOptional()
  @IsEnum(EstadoInstalacionCliente)
  estado?: EstadoInstalacionCliente;

  /*
   * Descripción general
   */

  @IsOptional()
  @Transform(toOptionalTrimmedString)
  @IsString()
  @MaxLength(500)
  descripcion?: string;

  @IsOptional()
  @Transform(toOptionalTrimmedString)
  @IsString()
  @MaxLength(1000)
  motivo?: string;

  @IsOptional()
  @Transform(toOptionalTrimmedString)
  @IsString()
  @MaxLength(2000)
  observaciones?: string;

  /*
   * Fechas
   */

  @IsOptional()
  @IsDateString()
  fechaProgramada?: string;

  @IsOptional()
  @IsDateString()
  fechaInicio?: string;

  /*
   * Ubicación
   */

  @IsOptional()
  @Transform(toOptionalTrimmedString)
  @IsString()
  @MaxLength(500)
  direccionInstalacion?: string;

  @IsOptional()
  @Transform(toOptionalTrimmedString)
  @IsString()
  @MaxLength(500)
  referenciaUbicacion?: string;

  @IsOptional()
  @Transform(toOptionalTrimmedString)
  @IsString()
  @MaxLength(100)
  coordenadas?: string;

  /*
   * Costos iniciales
   */

  @IsOptional()
  @ValidateNested()
  @Type(() => CrearClienteInstalacionCostosDto)
  costos?: CrearClienteInstalacionCostosDto;

  /*
   * Técnicos
   */

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ArrayUnique((tecnico: AsignarTecnicoInstalacionDto) => tecnico.tecnicoId)
  @ValidateNested({
    each: true,
  })
  @Type(() => AsignarTecnicoInstalacionDto)
  tecnicos?: AsignarTecnicoInstalacionDto[];
}
