import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Notificacion } from '../entities/notificacione.entity';
import { NotificationRepository } from '../domain/notification-repository';
import { throwFatalError } from 'src/Utils/CommonFatalError';

@Injectable()
export class PrismaNotificationRepository implements NotificationRepository {
  private readonly logger = new Logger(PrismaNotificationRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async save(noti: Notificacion): Promise<Notificacion> {
    try {
      const data = noti.toPersistence();

      if (data.id) {
        const record = await this.prisma.notificacion.update({
          where: { id: data.id },
          data: {
            ...data,
            id: undefined,
            fechaCreacion: undefined,
          },
        });
        return Notificacion.fromPrisma(record);
      } else {
        const { id, ...createData } = data;
        const record = await this.prisma.notificacion.create({
          data: createData,
        });
        return Notificacion.fromPrisma(record);
      }
    } catch (error) {
      throwFatalError(error, this.logger, 'PrismaNotificationRepository -save');
    }
  }

  async findById(id: number): Promise<Notificacion | null> {
    const record = await this.prisma.notificacion.findUnique({ where: { id } });
    return record ? Notificacion.fromPrisma(record) : null;
  }

  async findMany(params?: { empresaId?: number }): Promise<Notificacion[]> {
    const where = params?.empresaId ? { empresaId: params.empresaId } : {};
    const records = await this.prisma.notificacion.findMany({ where });
    return records.map(Notificacion.fromPrisma);
  }

  async deleteById(id: number): Promise<boolean> {
    try {
      await this.prisma.notificacion.delete({ where: { id } });
      return true;
    } catch (error) {
      if (error.code === 'P2025') return false; // No encontrado
      throwFatalError(error, this.logger, 'PrismaNotificationRepository -save');
    }
  }

  async deleteManyById(ids: number[]): Promise<number> {
    const result = await this.prisma.notificacion.deleteMany({
      where: { id: { in: ids } },
    });
    return result.count;
  }
}
