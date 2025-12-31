import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotificationUserRepository } from '../domain/notificaciones-usuario-repository';
import { NotificacionUsuario } from '../entities/notificaciones-usuario.entity';
import { throwFatalError } from 'src/Utils/CommonFatalError';

@Injectable()
export class PrismaNotificationUsuario implements NotificationUserRepository {
  private readonly logger = new Logger(PrismaNotificationUsuario.name);

  constructor(private readonly prisma: PrismaService) {}

  async save(noti: NotificacionUsuario): Promise<NotificacionUsuario> {
    try {
      const data = noti.toObject();

      // Si tiene ID, es una actualización (ej: marcar leída)
      if (data.id) {
        const record = await this.prisma.notificacionUsuario.update({
          where: { id: data.id },
          data: {
            leido: data.leido,
            leidoEn: data.leidoEn,
            fijadoHasta: data.fijadoHasta,
            // No tocamos usuarioId ni notificacionId en update usualmente
          },
        });
        return NotificacionUsuario.fromPrisma(record);
      }
      // Si no tiene ID, es creación
      else {
        const { id, ...createData } = data; // Quitamos ID undefined
        const record = await this.prisma.notificacionUsuario.create({
          data: createData,
        });
        return NotificacionUsuario.fromPrisma(record);
      }
    } catch (error) {
      throwFatalError(error, this.logger, 'PrismaNotificationUsuario - save');
    }
  }

  async findById(id: number): Promise<NotificacionUsuario | null> {
    const record = await this.prisma.notificacionUsuario.findUnique({
      where: { id },
    });
    // Si existe y NO está eliminado (opcional, depende de si quieres ver las borradas)
    if (record && !record.eliminado) {
      return NotificacionUsuario.fromPrisma(record);
    }
    return null;
  }

  async findByUsuarioId(usuarioId: number): Promise<NotificacionUsuario[]> {
    const records = await this.prisma.notificacionUsuario.findMany({
      where: {
        usuarioId,
        eliminado: false, // Solo traemos las activas
      },
      orderBy: { recibidoEn: 'desc' },
    });
    return records.map(NotificacionUsuario.fromPrisma);
  }

  async findByEstado(
    usuarioId: number,
    leido: boolean,
  ): Promise<NotificacionUsuario[]> {
    const records = await this.prisma.notificacionUsuario.findMany({
      where: {
        usuarioId,
        leido: leido,
        eliminado: false,
      },
      orderBy: { recibidoEn: 'desc' },
    });
    return records.map(NotificacionUsuario.fromPrisma);
  }

  // IMPLEMENTACIÓN DE SOFT DELETE
  async deleteById(id: number): Promise<boolean> {
    try {
      await this.prisma.notificacionUsuario.update({
        where: { id },
        data: {
          eliminado: true,
          eliminadoEn: new Date(),
        },
      });
      return true;
    } catch (error) {
      // Si el registro no existe, Prisma lanza error, lo capturamos
      if (error.code === 'P2025') return false;
      throwFatalError(
        error,
        this.logger,
        'PrismaNotificationUsuario - deleteById',
      );
    }
  }
}
