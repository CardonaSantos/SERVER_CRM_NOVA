import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  OBJETIVO_MAXIMO,
  TITULO_MAXIMO,
} from '../../domain/entities/meta-ticket.entity';

export const FORMATO_FECHA = /^\d{4}-\d{2}-\d{2}$/;
export const MENSAJE_FECHA = '$property debe tener el formato YYYY-MM-DD';

export class CrearMetaTicketDto {
  /** Usuario al que se le fija la meta */
  @IsInt()
  @Min(1)
  tecnicoId: number;

  /** Primer día de la meta (YYYY-MM-DD, Guatemala) */
  @Matches(FORMATO_FECHA, { message: MENSAJE_FECHA })
  fechaInicio: string;

  /** Último día de la meta, incluido */
  @Matches(FORMATO_FECHA, { message: MENSAJE_FECHA })
  fechaFin: string;

  /** Tickets a resolver */
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(OBJETIVO_MAXIMO)
  objetivo: number;

  /** Nombre de la meta */
  @IsOptional()
  @IsString()
  @MaxLength(TITULO_MAXIMO)
  titulo?: string | null;
}
