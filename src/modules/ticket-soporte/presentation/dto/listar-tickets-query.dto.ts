import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  Matches,
  Min,
} from 'class-validator';
import { PaginacionQueryDto } from 'src/common/http/paginacion-query.dto';
import {
  ComoArreglo,
  ComoArregloDeNumeros,
  ComoBooleano,
} from 'src/common/http/transformaciones-query';
import { BandejaTicket } from '../../domain/enums/bandeja-ticket.enum';
import {
  CampoFechaTicket,
  OrdenTicket,
} from '../../domain/enums/orden-ticket.enum';
import { PrioridadTicket } from '../../domain/enums/prioridad-ticket.enum';

const FECHA = /^\d{4}-\d{2}-\d{2}$/;

/** Filtros de la lista de tickets y de los contadores de las bandejas. */
export class ListarTicketsQueryDto extends PaginacionQueryDto {
  /** Bandeja. Por defecto ACTIVOS; al buscar se ignora. */
  @IsOptional()
  @IsEnum(BandejaTicket)
  bandeja?: BandejaTicket;

  /** Columna de orden. Sin ella, el orden propio de la bandeja. */
  @IsOptional()
  @IsEnum(OrdenTicket)
  sortBy?: OrdenTicket;

  /** Principal o apoyo en cualquiera de estos técnicos. */
  @IsOptional()
  @ComoArregloDeNumeros()
  @IsInt({ each: true })
  @Min(1, { each: true })
  tecnicoIds?: number[];

  /** Incluye los tickets sin nadie asignado (se suma a `tecnicoIds`). */
  @IsOptional()
  @ComoBooleano()
  @IsBoolean()
  sinTecnico?: boolean;

  /** Sectores del cliente. */
  @IsOptional()
  @ComoArregloDeNumeros()
  @IsInt({ each: true })
  @Min(1, { each: true })
  sectorIds?: number[];

  /** Con cualquiera de estas etiquetas. */
  @IsOptional()
  @ComoArregloDeNumeros()
  @IsInt({ each: true })
  @Min(1, { each: true })
  etiquetaIds?: number[];

  @IsOptional()
  @ComoArreglo()
  @IsEnum(PrioridadTicket, { each: true })
  prioridades?: PrioridadTicket[];

  /** Tickets de un cliente. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  clienteId?: number;

  /** Creados por este usuario. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  creadoPorId?: number;

  /** Solo los que creó quien consulta. */
  @IsOptional()
  @ComoBooleano()
  @IsBoolean()
  creadoPorMi?: boolean;

  /** Solo los asignados a quien consulta. */
  @IsOptional()
  @ComoBooleano()
  @IsBoolean()
  asignadosAMi?: boolean;

  /** Fecha que filtran `desde` y `hasta`. Por defecto APERTURA. */
  @IsOptional()
  @IsEnum(CampoFechaTicket)
  fechaDe?: CampoFechaTicket;

  /** `YYYY-MM-DD`, día completo de Guatemala. */
  @IsOptional()
  @Matches(FECHA, { message: 'desde debe tener el formato YYYY-MM-DD' })
  @IsDateString({ strict: true })
  desde?: string;

  /** `YYYY-MM-DD`, incluido. */
  @IsOptional()
  @Matches(FECHA, { message: 'hasta debe tener el formato YYYY-MM-DD' })
  @IsDateString({ strict: true })
  hasta?: string;
}
