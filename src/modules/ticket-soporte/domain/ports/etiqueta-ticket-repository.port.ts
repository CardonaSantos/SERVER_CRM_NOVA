import { EtiquetaTicketEntity } from '../entities/etiqueta-ticket.entity';

export const ETIQUETA_TICKET_REPOSITORY = Symbol('ETIQUETA_TICKET_REPOSITORY');

export interface EtiquetaTicketRepositoryPort {
  /** Hace esperar a quien quiera cambiar nombres hasta el fin de la unidad. */
  bloquearNombres(): Promise<void>;

  /** Por nombre sin distinguir mayúsculas; incluye las eliminadas. */
  findByNombre(nombre: string): Promise<EtiquetaTicketEntity | null>;

  findById(id: number): Promise<EtiquetaTicketEntity | null>;

  create(etiqueta: EtiquetaTicketEntity): Promise<EtiquetaTicketEntity>;

  update(etiqueta: EtiquetaTicketEntity): Promise<EtiquetaTicketEntity>;
}
