import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  Min,
} from 'class-validator';
import { DireccionOrden } from 'src/common/hexagonal/paginacion';
import { PaginacionQueryDto } from 'src/common/http/paginacion-query.dto';
import { TicketSoporteHistorialTipo } from '../../domain/enums/ticket-soporte-historial-tipo.enum';

export class ListarTicketSoporteHistorialQueryDto extends PaginacionQueryDto {
  /** Solo entradas de este ticket. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  ticketId?: number;

  /** Solo entradas hechas por este usuario. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  usuarioId?: number;

  /** Tipo de evento. */
  @IsOptional()
  @IsEnum(TicketSoporteHistorialTipo)
  tipo?: TicketSoporteHistorialTipo;

  /** Desde: `YYYY-MM-DD` (día completo de Guatemala) o fecha ISO con hora. */
  @IsOptional()
  @IsDateString()
  fechaDesde?: string;

  /** Hasta: `YYYY-MM-DD` (día completo de Guatemala) o fecha ISO con hora. */
  @IsOptional()
  @IsDateString()
  fechaHasta?: string;

  /** Dirección del orden por fecha; equivale a `sortDir`. Por defecto `desc`. */
  @IsOptional()
  @IsIn(['asc', 'desc'])
  ordenDireccion?: DireccionOrden;
}
