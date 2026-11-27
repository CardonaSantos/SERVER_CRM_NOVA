import { Inject, Injectable } from '@nestjs/common';
import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import {
  UNIDAD_DE_TRABAJO,
  UnidadDeTrabajoPort,
} from 'src/common/transaccion/unidad-de-trabajo.port';
import { MetaTicketEntity } from '../../domain/entities/meta-ticket.entity';
import {
  MetaTicketNoEncontradaError,
  MetaTicketSolapadaError,
} from '../../domain/errors/ticket-soporte-metrica.errors';
import {
  META_TICKET_REPOSITORY,
  MetaTicketRepositoryPort,
} from '../../domain/ports/meta-ticket-repository.port';
import { CambiosMetaTicket } from '../../domain/props/meta-ticket.props';
import { MetaTicketConAvance } from '../../domain/read-models/meta-ticket.read-model';
import { AvanceMetasService } from '../services/avance-metas.service';

export type ActualizarMetaTicketInput = CambiosMetaTicket & { metaId: number };

@Injectable()
export class ActualizarMetaTicketUseCase {
  constructor(
    @Inject(META_TICKET_REPOSITORY)
    private readonly metas: MetaTicketRepositoryPort,
    @Inject(UNIDAD_DE_TRABAJO) private readonly unidad: UnidadDeTrabajoPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
    private readonly avance: AvanceMetasService,
  ) {}

  async execute({
    metaId,
    ...cambios
  }: ActualizarMetaTicketInput): Promise<MetaTicketConAvance> {
    await this.unidad.ejecutar(async () => {
      const { tecnicoId } = await this.buscar(metaId);
      await this.metas.bloquearTecnico(tecnicoId);

      // Se vuelve a leer ya con el bloqueo tomado.
      const meta = await this.buscar(metaId);
      const antes = meta.toPrimitives();
      meta.editar(cambios, this.reloj.ahora());

      // Una meta antigua encimada se puede seguir editando si no se mueve.
      const seMovio =
        meta.fechaInicio !== antes.fechaInicio ||
        meta.fechaFin !== antes.fechaFin;

      if (
        seMovio &&
        (await this.metas.existeSolapada({
          tecnicoId,
          fechaInicio: meta.fechaInicio,
          fechaFin: meta.fechaFin,
          excluirId: metaId,
        }))
      ) {
        throw new MetaTicketSolapadaError();
      }

      await this.metas.update(meta);
    });

    return this.avance.detalle(metaId);
  }

  private async buscar(id: number): Promise<MetaTicketEntity> {
    const meta = await this.metas.findById(id);
    if (!meta) throw new MetaTicketNoEncontradaError();

    return meta;
  }
}
