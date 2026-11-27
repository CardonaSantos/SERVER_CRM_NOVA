import { Inject, Injectable } from '@nestjs/common';
import {
  aDesplazamiento,
  crearResultadoPaginado,
  normalizarPaginacion,
  ResultadoPaginado,
} from 'src/common/hexagonal/paginacion';
import { OrdenMetaTicket } from '../../domain/enums/orden-meta-ticket.enum';
import {
  META_TICKET_QUERY,
  MetaTicketQueryPort,
} from '../../domain/ports/meta-ticket-query.port';
import {
  MetaTicketConAvance,
  MetaTicketFiltros,
} from '../../domain/read-models/meta-ticket.read-model';
import { AvanceMetasService } from '../services/avance-metas.service';

export type ListarMetasTicketInput = MetaTicketFiltros & {
  page?: number;
  limit?: number;
};

type Comparador = (a: MetaTicketConAvance, b: MetaTicketConAvance) => number;

const COMPARADORES: Record<OrdenMetaTicket, Comparador> = {
  [OrdenMetaTicket.FECHA_INICIO]: (a, b) =>
    a.fechaInicio.localeCompare(b.fechaInicio),
  [OrdenMetaTicket.FECHA_FIN]: (a, b) => a.fechaFin.localeCompare(b.fechaFin),
  [OrdenMetaTicket.TECNICO]: (a, b) =>
    a.tecnico.nombre.localeCompare(b.tecnico.nombre, 'es'),
  [OrdenMetaTicket.AVANCE]: (a, b) => a.porcentaje - b.porcentaje,
};

@Injectable()
export class ListarMetasTicketUseCase {
  constructor(
    @Inject(META_TICKET_QUERY) private readonly consulta: MetaTicketQueryPort,
    private readonly avance: AvanceMetasService,
  ) {}

  async execute(
    input: ListarMetasTicketInput,
  ): Promise<ResultadoPaginado<MetaTicketConAvance>> {
    const paginacion = normalizarPaginacion(input);
    const texto = input.search?.toLocaleLowerCase('es');

    const metas = await this.consulta.findMany({ tecnicoId: input.tecnicoId });
    const candidatas = metas.filter(
      (m) =>
        (!input.desde || m.fechaFin >= input.desde) &&
        (!input.hasta || m.fechaInicio <= input.hasta) &&
        (!texto ||
          `${m.titulo ?? ''} ${m.tecnico.nombre}`
            .toLocaleLowerCase('es')
            .includes(texto)),
    );

    const comparar = COMPARADORES[input.sortBy ?? OrdenMetaTicket.FECHA_INICIO];
    const sentido = input.sortDir === 'asc' ? 1 : -1;
    const filtradas = (await this.avance.calcular(candidatas))
      .filter((m) => !input.estados?.length || input.estados.includes(m.estado))
      .sort((a, b) => sentido * (comparar(a, b) || a.id - b.id));

    const { skip, take } = aDesplazamiento(paginacion);

    return crearResultadoPaginado(
      filtradas.slice(skip, skip + take),
      filtradas.length,
      paginacion,
    );
  }
}
