import { NotificacionUsuario } from '../entities/notificaciones-usuario.entity';

export const NOTIFICACION_USUARIO = Symbol('NOTIFICACION_USUARIO');

export abstract class NotificationUserRepository {
  // Guardar (Crear o Actualizar estado como 'leido')
  abstract save(
    notification: NotificacionUsuario,
  ): Promise<NotificacionUsuario>;

  abstract findById(id: number): Promise<NotificacionUsuario | null>;

  abstract findByUsuarioId(usuarioId: number): Promise<NotificacionUsuario[]>;

  // Buscamos por estado (leído true/false) y que NO estén eliminadas
  abstract findByEstado(
    usuarioId: number,
    leido: boolean,
  ): Promise<NotificacionUsuario[]>;

  // Aquí definiremos si el delete es físico o lógico en la implementación
  abstract deleteById(id: number): Promise<boolean>;
}
