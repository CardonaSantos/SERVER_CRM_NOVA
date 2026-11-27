import { Injectable } from '@nestjs/common';

import { PrismaTransaccional } from 'src/common/transaccion/prisma-transaccional.service';

import { NotificacionEntity } from '../../domain/entities/notificacion.entity';
import { NotificacionRepositoryPort } from '../../domain/ports/notificacion-repository.port';
import { NotificacionPrismaMapper } from './notificacion-prisma.mapper';

@Injectable()
export class NotificacionPrismaRepository
  implements NotificacionRepositoryPort
{
  constructor(private readonly transaccional: PrismaTransaccional) {}

  private get db() {
    return this.transaccional.cliente;
  }

  create(
    notificacion: NotificacionEntity,
    destinatarioIds: readonly number[],
  ): Promise<NotificacionEntity> {
    const creadaEn = notificacion.toPrimitives().creadaEn;

    return this.transaccional.ejecutar(async () => {
      const record = await this.db.notificacion.create({
        data: NotificacionPrismaMapper.toCreatePersistence(notificacion),
      });

      await this.db.notificacionUsuario.createMany({
        data: [...new Set(destinatarioIds)].map((usuarioId) => ({
          usuarioId,
          notificacionId: record.id,
          recibidoEn: creadaEn,
        })),
        skipDuplicates: true,
      });

      return NotificacionPrismaMapper.toDomain(record);
    });
  }
}
