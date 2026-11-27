import { MetaTicketEntity } from '../entities/meta-ticket.entity';

export const META_TICKET_REPOSITORY = Symbol('META_TICKET_REPOSITORY');

export type BuscarSolapadaParams = {
  tecnicoId: number;
  fechaInicio: string;
  fechaFin: string;
  /** La meta que se está editando. */
  excluirId?: number;
};

export interface MetaTicketRepositoryPort {
  create(meta: MetaTicketEntity): Promise<MetaTicketEntity>;

  /** Falla con `META_TICKET_CANCELADA` si ya se canceló entre la lectura y la escritura. */
  update(meta: MetaTicketEntity): Promise<void>;

  findById(id: number): Promise<MetaTicketEntity | null>;

  /**
   * Hace esperar a quien quiera crear o mover metas del mismo técnico. Solo
   * sirve dentro de la unidad de trabajo.
   */
  bloquearTecnico(tecnicoId: number): Promise<void>;

  /** Si el técnico tiene otra meta sin cancelar que comparta algún día. */
  existeSolapada(params: BuscarSolapadaParams): Promise<boolean>;
}
