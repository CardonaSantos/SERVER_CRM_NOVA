import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Matches, Min } from 'class-validator';
import { PaginacionQueryDto } from 'src/common/http/paginacion-query.dto';
import { ComoArreglo } from 'src/common/http/transformaciones-query';
import { EstadoMetaTicket } from '../../domain/enums/estado-meta-ticket.enum';
import { OrdenMetaTicket } from '../../domain/enums/orden-meta-ticket.enum';
import { FORMATO_FECHA, MENSAJE_FECHA } from './crear-meta-ticket.dto';

export class ListarMetasTicketQueryDto extends PaginacionQueryDto {
  /** Metas de un técnico */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  tecnicoId?: number;

  /** Uno o varios estados */
  @IsOptional()
  @ComoArreglo()
  @IsEnum(EstadoMetaTicket, { each: true })
  estados?: EstadoMetaTicket[];

  /** Metas que tocan el rango: desde (YYYY-MM-DD) */
  @IsOptional()
  @Matches(FORMATO_FECHA, { message: MENSAJE_FECHA })
  desde?: string;

  /** Metas que tocan el rango: hasta (YYYY-MM-DD) */
  @IsOptional()
  @Matches(FORMATO_FECHA, { message: MENSAJE_FECHA })
  hasta?: string;

  /** Columna de orden; por defecto, fecha de inicio (la más nueva primero) */
  @IsOptional()
  @IsEnum(OrdenMetaTicket)
  sortBy?: OrdenMetaTicket;
}
