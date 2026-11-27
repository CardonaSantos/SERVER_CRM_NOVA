import { RangoFechas } from '../policies/calendario.policy';
import {
  CargaTecnico,
  InstalacionCompletadaTecnico,
  TecnicoDelPanel,
  TicketResueltoTecnico,
} from '../read-models/panel-tecnico.read-model';

export const PANEL_TECNICO_QUERY = Symbol('PANEL_TECNICO_QUERY');

export type CargaParams = {
  tecnicoId: number;
  hoy: RangoFechas;
  /** Un ticket abierto antes de este instante lleva más de 48 horas. */
  hace48Horas: Date;
};

export interface PanelTecnicoQueryPort {
  findTecnico(tecnicoId: number): Promise<TecnicoDelPanel | null>;
  contarCarga(params: CargaParams): Promise<CargaTecnico>;
  /** Tickets (como principal o apoyo) cerrados en el rango. */
  findTicketsResueltos(
    tecnicoId: number,
    rango: RangoFechas,
  ): Promise<TicketResueltoTecnico[]>;
  findInstalacionesCompletadas(
    tecnicoId: number,
    rango: RangoFechas,
  ): Promise<InstalacionCompletadaTecnico[]>;
}
