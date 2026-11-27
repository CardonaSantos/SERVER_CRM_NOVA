import { DireccionOrden } from 'src/common/hexagonal/paginacion';

import { CategoriaNotificacion } from '../enums/categoria-notificacion.enum';
import { SeveridadNotificacion } from '../enums/severidad-notificacion.enum';
import { ReferenciaNotificacion } from '../props/notificacion.props';

/** Una notificación tal como la ve un usuario en su bandeja. */
export type NotificacionBandejaItem = {
  id: number;
  titulo: string | null;
  mensaje: string;
  categoria: CategoriaNotificacion;
  severidad: SeveridadNotificacion;
  referencia: ReferenciaNotificacion | null;
  ruta: string | null;
  etiquetaAccion: string | null;
  creadaEn: Date;
  leidaEn: Date | null;
};

export type NotificacionBandejaFiltros = {
  categorias?: CategoriaNotificacion[];
  severidades?: SeveridadNotificacion[];
  soloNoLeidas?: boolean;
  /** `YYYY-MM-DD`, días completos de Guatemala, sobre la fecha de creación. */
  desde?: string;
  hasta?: string;
  /** Busca en título y mensaje. */
  search?: string;
  sortDir?: DireccionOrden;
};

export type ContadoresNotificacion = { noLeidas: number };
