import { Inject, Injectable } from '@nestjs/common';
import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import { MetaTicketNoEncontradaError } from '../../domain/errors/ticket-soporte-metrica.errors';
import { calcularAvance } from '../../domain/policies/avance-meta.policy';
import {
  META_TICKET_QUERY,
  MetaTicketQueryPort,
} from '../../domain/ports/meta-ticket-query.port';
import {
  METRICA_TICKET_QUERY,
  MetricaTicketQueryPort,
} from '../../domain/ports/metrica-ticket-query.port';
import {
  MetaTicketConAvance,
  MetaTicketReadModel,
} from '../../domain/read-models/meta-ticket.read-model';

@Injectable()
export class AvanceMetasService {
  constructor(
    @Inject(META_TICKET_QUERY) private readonly metas: MetaTicketQueryPort,
    @Inject(METRICA_TICKET_QUERY)
    private readonly tickets: MetricaTicketQueryPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  /** Calcula el avance de varias metas con una sola consulta de tickets. */
  async calcular(metas: MetaTicketReadModel[]): Promise<MetaTicketConAvance[]> {
    if (!metas.length) return [];

    const resueltos = await this.tickets.ticketsResueltos({
      tecnicoIds: [...new Set(metas.map((m) => m.tecnico.id))],
      desde: metas.map((m) => m.fechaInicio).sort()[0],
      hasta: metas.map((m) => m.fechaFin).sort()[metas.length - 1],
    });
    const hoy = this.reloj.fechaOperativa();

    return metas.map((meta) => calcularAvance(meta, resueltos, hoy));
  }

  async detalle(metaId: number): Promise<MetaTicketConAvance> {
    const meta = await this.metas.findDetail(metaId);
    if (!meta) throw new MetaTicketNoEncontradaError();

    const [conAvance] = await this.calcular([meta]);

    return conAvance;
  }
}
