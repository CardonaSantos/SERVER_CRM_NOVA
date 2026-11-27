import { AudienciaNotificacion } from '../enums/audiencia-notificacion.enum';
import { CategoriaNotificacion } from '../enums/categoria-notificacion.enum';
import { SeveridadNotificacion } from '../enums/severidad-notificacion.enum';

/** Entidad de negocio a la que apunta la notificación (p. ej. una zona o un ticket). */
export type ReferenciaNotificacion = { tipo: string; id: number };

export type NotificacionProps = {
  id: number | null;
  titulo: string | null;
  mensaje: string;
  categoria: CategoriaNotificacion;
  severidad: SeveridadNotificacion;
  /** Clasificación libre del emisor (p. ej. `CRON JOB`). */
  subtipo: string | null;
  referencia: ReferenciaNotificacion | null;
  /** Ruta de la UI a la que lleva la notificación. */
  ruta: string | null;
  etiquetaAccion: string | null;
  audiencia: AudienciaNotificacion;
  remitenteId: number | null;
  creadaEn: Date;
};

export type CrearNotificacionProps = {
  titulo?: string | null;
  mensaje: string;
  categoria: CategoriaNotificacion;
  severidad?: SeveridadNotificacion;
  subtipo?: string | null;
  referencia?: ReferenciaNotificacion | null;
  ruta?: string | null;
  etiquetaAccion?: string | null;
  audiencia: AudienciaNotificacion;
  remitenteId?: number | null;
};
