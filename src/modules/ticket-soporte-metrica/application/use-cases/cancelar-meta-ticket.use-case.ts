import { Inject, Injectable } from '@nestjs/common';
import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import { MetaTicketNoEncontradaError } from '../../domain/errors/ticket-soporte-metrica.errors';
import {
  META_TICKET_REPOSITORY,
  MetaTicketRepositoryPort,
} from '../../domain/ports/meta-ticket-repository.port';
import { MetaTicketConAvance } from '../../domain/read-models/meta-ticket.read-model';
import { AvanceMetasService } from '../services/avance-metas.service';

@Injectable()
export class CancelarMetaTicketUseCase {
  constructor(
    @Inject(META_TICKET_REPOSITORY)
    private readonly metas: MetaTicketRepositoryPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
    private readonly avance: AvanceMetasService,
  ) {}

  /** La meta no se borra: queda cancelada y libera sus fechas. */
  async execute(input: { metaId: number }): Promise<MetaTicketConAvance> {
    const meta = await this.metas.findById(input.metaId);
    if (!meta) throw new MetaTicketNoEncontradaError();

    meta.cancelar(this.reloj.ahora());
    await this.metas.update(meta);

    return this.avance.detalle(input.metaId);
  }
}
