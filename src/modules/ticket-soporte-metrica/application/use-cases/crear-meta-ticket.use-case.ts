import { Inject, Injectable } from '@nestjs/common';
import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import {
  UNIDAD_DE_TRABAJO,
  UnidadDeTrabajoPort,
} from 'src/common/transaccion/unidad-de-trabajo.port';
import { MetaTicketEntity } from '../../domain/entities/meta-ticket.entity';
import {
  MetaTicketSolapadaError,
  MetaTicketTecnicoNoDisponibleError,
} from '../../domain/errors/ticket-soporte-metrica.errors';
import {
  META_TICKET_QUERY,
  MetaTicketQueryPort,
} from '../../domain/ports/meta-ticket-query.port';
import {
  META_TICKET_REPOSITORY,
  MetaTicketRepositoryPort,
} from '../../domain/ports/meta-ticket-repository.port';
import { CrearMetaTicketProps } from '../../domain/props/meta-ticket.props';
import { MetaTicketConAvance } from '../../domain/read-models/meta-ticket.read-model';
import { AvanceMetasService } from '../services/avance-metas.service';

export type CrearMetaTicketInput = CrearMetaTicketProps;

@Injectable()
export class CrearMetaTicketUseCase {
  constructor(
    @Inject(META_TICKET_REPOSITORY)
    private readonly metas: MetaTicketRepositoryPort,
    @Inject(META_TICKET_QUERY) private readonly consulta: MetaTicketQueryPort,
    @Inject(UNIDAD_DE_TRABAJO) private readonly unidad: UnidadDeTrabajoPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
    private readonly avance: AvanceMetasService,
  ) {}

  async execute(input: CrearMetaTicketInput): Promise<MetaTicketConAvance> {
    const meta = MetaTicketEntity.create(input, this.reloj.ahora());

    const creada = await this.unidad.ejecutar(async () => {
      await this.metas.bloquearTecnico(meta.tecnicoId);

      if (!(await this.consulta.tecnicoActivo(meta.tecnicoId))) {
        throw new MetaTicketTecnicoNoDisponibleError();
      }

      if (await this.metas.existeSolapada(meta)) {
        throw new MetaTicketSolapadaError();
      }

      return this.metas.create(meta);
    });

    return this.avance.detalle(creada.id!);
  }
}
