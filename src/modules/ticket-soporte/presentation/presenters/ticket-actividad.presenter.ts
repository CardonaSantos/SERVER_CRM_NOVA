import {
  presentarPaginado,
  ResultadoPaginado,
} from 'src/common/hexagonal/paginacion';
import { ActividadTicketVisible } from '../../application/use-cases/listar-actividad-ticket.use-case';

export class TicketActividadPresenter {
  static item(a: ActividadTicketVisible) {
    const base = {
      id: a.id,
      fecha: a.fecha.toISOString(),
      autor: {
        id: a.autor.id,
        nombre: a.autor.nombre,
        avatarUrl: a.autor.avatarUrl,
      },
      puedeEliminar: a.puedeEliminar,
    };

    if (a.tipo === 'EVENTO') {
      return { tipo: a.tipo, ...base, evento: a.evento, texto: a.texto };
    }

    return {
      tipo: a.tipo,
      ...base,
      texto: a.texto,
      imagenes: a.imagenes.map((imagen) => ({
        id: imagen.id,
        url: imagen.url,
      })),
      eliminado: a.eliminado
        ? { fecha: a.eliminado.fecha.toISOString(), por: a.eliminado.por }
        : null,
    };
  }

  static listado(resultado: ResultadoPaginado<ActividadTicketVisible>) {
    return presentarPaginado(resultado, (a) =>
      TicketActividadPresenter.item(a),
    );
  }
}
