import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TipoInstalacionCliente } from '../../domain/enums/tipo-instalacion-cliente.enum';
import { RolTecnicoOperacionCliente } from '../../domain/enums/rol-tecnico-operacion-cliente.enum';

const toNumber = ({ value }: { value: unknown }) => {
  if (value === undefined || value === null || value === '') return undefined;
  return Number(value);
};

export class ActualizarCostosInstalacionDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  costoInstalacion?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  costoMateriales?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  costoManoObra?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  costoOtros?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  montoCobradoCliente?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2_000)
  notasCostos?: string | null;
}

export class ActualizarClienteInstalacionDto {
  @IsOptional()
  @IsEnum(TipoInstalacionCliente)
  tipo?: TipoInstalacionCliente;

  @IsOptional()
  @IsInt()
  @Min(1)
  asesorId?: number | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  ticketId?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  descripcion?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(1_000)
  motivo?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(2_000)
  observaciones?: string | null;

  @IsOptional()
  @IsDateString()
  fechaProgramada?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  direccionInstalacion?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  referenciaUbicacion?: string | null;

  @IsOptional()
  @IsNumber()
  latitud?: number | null;

  @IsOptional()
  @IsNumber()
  longitud?: number | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => ActualizarCostosInstalacionDto)
  costos?: ActualizarCostosInstalacionDto;

  /**
   * undefined: no modifica asignaciones.
   * array: reemplaza el conjunto completo.
   */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => ActualizarTecnicoInstalacionDto)
  tecnicos?: ActualizarTecnicoInstalacionDto[];
}

export class ActualizarTecnicoInstalacionDto {
  @IsInt()
  @Min(1)
  tecnicoId: number;

  @IsString()
  rol: RolTecnicoOperacionCliente;

  @IsBoolean()
  esResponsable: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  tiempoMinutos?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(1_000)
  observaciones?: string | null;
}
