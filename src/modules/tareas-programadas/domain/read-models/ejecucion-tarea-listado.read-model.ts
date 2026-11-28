import { DireccionOrden } from 'src/common/hexagonal/paginacion';

import { EstadoEjecucionTarea } from '../enums/ejecucion-tarea.enum';
import { OrdenEjecucionTarea } from '../enums/orden-ejecucion-tarea.enum';
import { EjecucionTareaProps } from '../props/ejecucion-tarea.props';

export type EjecucionTareaFiltros = {
  /** `YYYY-MM-DD`: fecha operativa desde (incluida). */
  desde?: string;
  /** `YYYY-MM-DD`: fecha operativa hasta (incluida). */
  hasta?: string;
  tarea?: string;
  estados?: EstadoEjecucionTarea[];
  facturacionZonaId?: number;
  /** Busca en la clave. */
  search?: string;
  sortBy?: OrdenEjecucionTarea;
  sortDir?: DireccionOrden;
};

export type EjecucionTareaListItem = Omit<EjecucionTareaProps, 'id'> & {
  id: number;
};

/** Lo que ve la pantalla: el registro más si quedó abandonada. */
export type EjecucionTareaVista = EjecucionTareaListItem & {
  /** En ejecución con el arriendo vencido: el proceso murió a la mitad. */
  abandonada: boolean;
};

/** Una tarea que un super administrador puede lanzar a mano. */
export type TareaManualDisponible = { tarea: string; descripcion: string };
