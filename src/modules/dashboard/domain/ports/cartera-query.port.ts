import { AgrupacionUbicacion } from '../enums/agrupacion-ubicacion.enum';
import {
  ClienteConPlan,
  ClienteUbicado,
} from '../read-models/cartera.read-model';

export const CARTERA_QUERY = Symbol('CARTERA_QUERY');

export interface CarteraQueryPort {
  /** Clientes activos y suspendidos, con su plan. */
  findClientesConPlan(): Promise<ClienteConPlan[]>;
  /** Clientes no eliminados ni desinstalados, con su grupo. */
  findClientesUbicados(agrupar: AgrupacionUbicacion): Promise<ClienteUbicado[]>;
}
