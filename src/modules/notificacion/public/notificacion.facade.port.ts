import { CategoriaNotificacion } from '../domain/enums/categoria-notificacion.enum';
import { SeveridadNotificacion } from '../domain/enums/severidad-notificacion.enum';

export const NOTIFICACION = Symbol('NOTIFICACION');

/** Se suman; quien cae en más de uno la recibe una vez. Solo usuarios activos. */
export type DestinoNotificacion = {
  usuarioIds?: readonly number[];
  /** Roles con el valor de `RolUsuario` (usar los grupos de `grupos-roles.ts`). */
  roles?: readonly string[];
  todos?: boolean;
};

export type NotificarInput = {
  titulo?: string | null;
  mensaje: string;
  categoria: CategoriaNotificacion;
  severidad?: SeveridadNotificacion;
  subtipo?: string | null;
  referencia?: { tipo: string; id: number } | null;
  /** Ruta de la UI a la que lleva (p. ej. `/ticket-soporte/15`). */
  ruta?: string | null;
  etiquetaAccion?: string | null;
  remitenteId?: number | null;
  destino: DestinoNotificacion;
};

export type NotificarResult = {
  /** `null` si nadie cayó en el destino: no se guarda nada. */
  notificacionId: number | null;
  destinatarios: number;
};

export type EnviarPushInput = {
  usuarioId: number;
  titulo: string;
  cuerpo: string;
  /** FCM solo admite texto en los valores. */
  datos?: Record<string, string>;
  /** Canal de Android (por omisión `tickets`). */
  canal?: string;
  /** Pushes con la misma clave se reemplazan en el teléfono. */
  claveAgrupacion?: string;
  /** Cuánto tiempo puede esperar el push si el teléfono está apagado. */
  vigenciaMs?: number;
};

export type EnviarPushResult = {
  omitido:
    | 'PUSH_DESACTIVADO'
    | 'SIN_DISPOSITIVOS'
    | 'PROVEEDOR_NO_CONFIGURADO'
    | null;
  dispositivos: number;
  exitosos: number;
  fallidos: number;
};

/** Avisos internos del CRM: bandeja de cada usuario y push al teléfono. */
export interface NotificacionFacadePort {
  /** Guarda la notificación en la bandeja de los destinatarios y avisa en vivo. */
  notificar(input: NotificarInput): Promise<NotificarResult>;

  /**
   * Envía un push a los teléfonos del usuario, según sus preferencias.
   * Nunca lanza por un fallo del proveedor: lo informa en el resultado.
   */
  enviarPush(input: EnviarPushInput): Promise<EnviarPushResult>;
}
