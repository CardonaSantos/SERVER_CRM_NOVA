import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

import { PaginacionQueryDto } from 'src/common/http/paginacion-query.dto';
import { ComoArreglo } from 'src/common/http/transformaciones-query';

import { EstadoEjecucionTarea } from '../../domain/enums/ejecucion-tarea.enum';
import { OrdenEjecucionTarea } from '../../domain/enums/orden-ejecucion-tarea.enum';

const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const NOMBRE_TAREA = /^[A-Z][A-Z0-9]*(_[A-Z0-9]+)*$/;

/** `search` busca en la clave. Por omisión, la más reciente primero (`iniciadaEn` `desc`). */
export class ListarEjecucionesTareaQueryDto extends PaginacionQueryDto {
  /** Fecha operativa desde, `YYYY-MM-DD` (incluida). */
  @IsOptional()
  @Matches(FECHA, { message: 'desde debe tener el formato YYYY-MM-DD' })
  @IsDateString({ strict: true })
  desde?: string;

  /** Fecha operativa hasta, `YYYY-MM-DD` (incluida). */
  @IsOptional()
  @Matches(FECHA, { message: 'hasta debe tener el formato YYYY-MM-DD' })
  @IsDateString({ strict: true })
  hasta?: string;

  /** Nombre de la tarea: `GENERAR_FACTURAS`, `LIMPIEZA_SESIONES`… */
  @IsOptional()
  @MaxLength(60)
  @Matches(NOMBRE_TAREA, {
    message: 'tarea debe ir en mayúsculas y guiones bajos',
  })
  tarea?: string;

  /** Uno o varios estados (`?estados=FALLIDA&estados=EJECUTANDO`). */
  @IsOptional()
  @ComoArreglo()
  @IsEnum(EstadoEjecucionTarea, { each: true })
  estados?: EstadoEjecucionTarea[];

  /** Solo las de esa zona de facturación. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  facturacionZonaId?: number;

  /** Columna de orden. */
  @IsOptional()
  @IsEnum(OrdenEjecucionTarea)
  sortBy?: OrdenEjecucionTarea;
}
