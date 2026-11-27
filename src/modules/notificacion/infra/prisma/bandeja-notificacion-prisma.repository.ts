import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaTransaccional } from 'src/common/transaccion/prisma-transaccional.service';

import { BandejaNotificacionRepositoryPort } from '../../domain/ports/bandeja-notificacion-repository.port';

@Injectable()
export class BandejaNotificacionPrismaRepository
  implements BandejaNotificacionRepositoryPort
{
  constructor(private readonly transaccional: PrismaTransaccional) {}

  private get db() {
    return this.transaccional.cliente;
  }

  private enBandeja(usuarioId: number): Prisma.NotificacionUsuarioWhereInput {
    return { usuarioId, eliminado: false };
  }

  async marcarLeida(
    usuarioId: number,
    notificacionId: number,
    fecha: Date,
  ): Promise<boolean> {
    const fila = await this.db.notificacionUsuario.findFirst({
      where: { ...this.enBandeja(usuarioId), notificacionId },
      select: { id: true, leido: true },
    });

    if (!fila) return false;

    if (!fila.leido) {
      // Solo la primera vez: conserva la fecha original de lectura.
      await this.db.notificacionUsuario.updateMany({
        where: { id: fila.id, leido: false },
        data: { leido: true, leidoEn: fecha },
      });
    }

    return true;
  }

  async marcarTodasLeidas(usuarioId: number, fecha: Date): Promise<number> {
    const { count } = await this.db.notificacionUsuario.updateMany({
      where: { ...this.enBandeja(usuarioId), leido: false },
      data: { leido: true, leidoEn: fecha },
    });

    return count;
  }

  async descartar(
    usuarioId: number,
    notificacionId: number,
    fecha: Date,
  ): Promise<boolean> {
    const { count } = await this.db.notificacionUsuario.updateMany({
      where: { ...this.enBandeja(usuarioId), notificacionId },
      data: { eliminado: true, eliminadoEn: fecha },
    });

    return count > 0;
  }

  async descartarTodas(usuarioId: number, fecha: Date): Promise<number> {
    const { count } = await this.db.notificacionUsuario.updateMany({
      where: this.enBandeja(usuarioId),
      data: { eliminado: true, eliminadoEn: fecha },
    });

    return count;
  }
}
