import { Notificacion } from '../entities/notificacione.entity';

export const NOTIFICATION_REPOSITORY = Symbol('NOTIFICATION_REPOSITORY');

export abstract class NotificationRepository {
  abstract save(notificacion: Notificacion): Promise<Notificacion>;

  abstract findById(id: number): Promise<Notificacion | null>;

  abstract findMany(params?: { empresaId?: number }): Promise<Notificacion[]>;

  abstract deleteById(id: number): Promise<boolean>; // Devuelve true si borró, false si no existía

  // Devuelve número de registros eliminados, no un objeto Prisma
  abstract deleteManyById(ids: number[]): Promise<number>;
}
