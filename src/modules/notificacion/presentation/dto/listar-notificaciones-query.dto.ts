import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  Matches,
} from 'class-validator';

import { PaginacionQueryDto } from 'src/common/http/paginacion-query.dto';
import {
  ComoArreglo,
  ComoBooleano,
} from 'src/common/http/transformaciones-query';

import { CategoriaNotificacion } from '../../domain/enums/categoria-notificacion.enum';
import { SeveridadNotificacion } from '../../domain/enums/severidad-notificacion.enum';

const FECHA = /^\d{4}-\d{2}-\d{2}$/;

/** `search` busca en título y mensaje. Orden por fecha de creación (`sortDir`, por omisión `desc`). */
export class ListarNotificacionesQueryDto extends PaginacionQueryDto {
  /** Una o varias categorías (`?categorias=BOT&categorias=SOPORTE`). */
  @IsOptional()
  @ComoArreglo()
  @IsEnum(CategoriaNotificacion, { each: true })
  categorias?: CategoriaNotificacion[];

  /** Una o varias severidades. */
  @IsOptional()
  @ComoArreglo()
  @IsEnum(SeveridadNotificacion, { each: true })
  severidades?: SeveridadNotificacion[];

  /** Solo las no leídas. */
  @IsOptional()
  @ComoBooleano()
  @IsBoolean()
  noLeidas?: boolean;

  /** `YYYY-MM-DD`, día completo de Guatemala. */
  @IsOptional()
  @Matches(FECHA, { message: 'desde debe tener el formato YYYY-MM-DD' })
  @IsDateString({ strict: true })
  desde?: string;

  /** `YYYY-MM-DD`, día completo de Guatemala. */
  @IsOptional()
  @Matches(FECHA, { message: 'hasta debe tener el formato YYYY-MM-DD' })
  @IsDateString({ strict: true })
  hasta?: string;
}
