import { TecnicoMetrica } from '../read-models/meta-ticket.read-model';
import {
  SituacionTickets,
  TicketPeriodoReadModel,
  TicketResueltoReadModel,
} from '../read-models/metrica-ticket.read-model';

export const METRICA_TICKET_QUERY = Symbol('METRICA_TICKET_QUERY');

/** Rangos en días completos de Guatemala, con ambos extremos. */
export interface MetricaTicketQueryPort {
  ticketsResueltos(params: {
    tecnicoIds: number[];
    desde: string;
    hasta: string;
  }): Promise<TicketResueltoReadModel[]>;

  /** Abiertos o resueltos en el periodo; sin cancelados. */
  ticketsDelPeriodo(params: {
    desde: string;
    hasta: string;
  }): Promise<TicketPeriodoReadModel[]>;

  /** Los usuarios técnicos activos más los `incluirIds`, activos o no. */
  tecnicos(incluirIds: number[]): Promise<TecnicoMetrica[]>;

  situacion(hoy: string): Promise<SituacionTickets>;
}
