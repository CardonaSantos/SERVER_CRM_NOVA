import {
  presentarPaginado,
  RespuestaPaginada,
  ResultadoPaginado,
} from 'src/common/hexagonal/paginacion';
import { TicketSoporteHistorialResumen } from '../../domain/read-models/ticket-soporte-historial.read-model';
import { TicketSoporteHistorialResponseDto } from '../dto/ticket-soporte-historial-response.dto';

export class TicketSoporteHistorialPresenter {
  static item(
    resumen: TicketSoporteHistorialResumen,
  ): TicketSoporteHistorialResponseDto {
    return {
      id: resumen.id,
      ticketId: resumen.ticketId,
      tipo: resumen.tipo,
      descripcion: resumen.descripcion,
      actor: {
        usuarioId: resumen.usuarioId,
        nombre: resumen.usuarioNombre ?? 'Sistema',
      },
      creadoEn: resumen.creadoEn.toISOString(),
    };
  }

  static listado(
    resultado: ResultadoPaginado<TicketSoporteHistorialResumen>,
  ): RespuestaPaginada<TicketSoporteHistorialResponseDto> {
    return presentarPaginado(resultado, TicketSoporteHistorialPresenter.item);
  }
}
