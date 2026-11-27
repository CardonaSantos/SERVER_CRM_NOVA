import { CategoriaNotificacion } from '../../domain/enums/categoria-notificacion.enum';
import { SeveridadNotificacion } from '../../domain/enums/severidad-notificacion.enum';

export class ReferenciaNotificacionResponseDto {
  /** Tipo de lo referido (p. ej. `FACTURACION_ZONA`, `TICKET_SOPORTE`). */
  tipo: string;
  /** Id de lo referido. */
  id: number;
}

export class NotificacionResponseDto {
  /** Id de la notificación. */
  id: number;
  /** Título; puede faltar. */
  titulo: string | null;
  /** Texto para mostrar. */
  mensaje: string;
  /** Categoría. */
  categoria: CategoriaNotificacion;
  /** Severidad. */
  severidad: SeveridadNotificacion;
  /** A qué se refiere, si aplica. */
  referencia: ReferenciaNotificacionResponseDto | null;
  /** Ruta de la UI a la que lleva, si aplica. */
  ruta: string | null;
  /** Texto del botón de acción, si aplica. */
  etiquetaAccion: string | null;
  /** ISO 8601. */
  creadaEn: string;
  /** Si quien consulta ya la leyó. */
  leida: boolean;
  /** ISO 8601 o null. */
  leidaEn: string | null;
}

export class ContadoresNotificacionResponseDto {
  /** No leídas en la bandeja (sin descartadas). */
  noLeidas: number;
}

export class NotificacionAccionResponseDto {
  /** Id de la notificación afectada. */
  notificacionId: number;
}

export class NotificacionesMarcadasResponseDto {
  /** Cuántas pasaron a leídas. */
  marcadas: number;
}

export class NotificacionesDescartadasResponseDto {
  /** Cuántas se quitaron de la bandeja. */
  descartadas: number;
}

export class DispositivoPushResponseDto {
  /** Instalación de la app. */
  instalacionId: string;
  /** `ANDROID`. */
  plataforma: string;
  /** Si recibe push. */
  activo: boolean;
  /** ISO 8601. */
  registradoEn: string;
}

export class DispositivoPushRevocadoResponseDto {
  /** Instalación de la app. */
  instalacionId: string;
  /** `false` si ya estaba revocada (no es error). */
  revocado: boolean;
}
