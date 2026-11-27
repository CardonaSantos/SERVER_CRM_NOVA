import {
  presentarPaginado,
  ResultadoPaginado,
} from 'src/common/hexagonal/paginacion';
import { EtiquetaTicketEntity } from '../../domain/entities/etiqueta-ticket.entity';
import { SolucionTicketEntity } from '../../domain/entities/solucion-ticket.entity';
import {
  EtiquetaTicketListItem,
  SolucionTicketListItem,
} from '../../domain/read-models/catalogo-ticket.read-model';

export class CatalogoTicketPresenter {
  static etiquetas(resultado: ResultadoPaginado<EtiquetaTicketListItem>) {
    return presentarPaginado(resultado, (m) => ({
      id: m.id,
      nombre: m.nombre,
      tickets: m.tickets,
      creadoEn: m.creadoEn?.toISOString() ?? null,
    }));
  }

  static etiqueta(etiqueta: EtiquetaTicketEntity) {
    return { id: etiqueta.id!, nombre: etiqueta.nombre };
  }

  static soluciones(resultado: ResultadoPaginado<SolucionTicketListItem>) {
    return presentarPaginado(resultado, (m) => ({
      id: m.id,
      nombre: m.nombre,
      descripcion: m.descripcion,
      tickets: m.tickets,
      creadoEn: m.creadoEn.toISOString(),
    }));
  }

  static solucion(solucion: SolucionTicketEntity) {
    const { id, nombre, descripcion } = solucion.toPrimitives();

    return { id: id!, nombre, descripcion };
  }
}
