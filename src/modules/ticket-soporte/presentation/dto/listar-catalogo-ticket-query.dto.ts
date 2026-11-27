import { IsEnum, IsOptional } from 'class-validator';
import { PaginacionQueryDto } from 'src/common/http/paginacion-query.dto';
import { OrdenCatalogoTicket } from '../../domain/enums/orden-ticket.enum';

export class ListarCatalogoTicketQueryDto extends PaginacionQueryDto {
  /** Columna de orden. Por defecto el nombre. */
  @IsOptional()
  @IsEnum(OrdenCatalogoTicket)
  sortBy?: OrdenCatalogoTicket;
}
