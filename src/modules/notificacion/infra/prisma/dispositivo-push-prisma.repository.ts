import { Injectable } from '@nestjs/common';

import { PrismaTransaccional } from 'src/common/transaccion/prisma-transaccional.service';

import {
  DispositivoPushRegistrado,
  DispositivoPushRepositoryPort,
  PreferenciasPush,
  RegistroDispositivoPush,
} from '../../domain/ports/dispositivo-push-repository.port';

/** Por ahora el servidor solo atiende FCM en Android. */
const PROVEEDOR = 'FCM';
const PLATAFORMA = 'ANDROID';

@Injectable()
export class DispositivoPushPrismaRepository
  implements DispositivoPushRepositoryPort
{
  constructor(private readonly transaccional: PrismaTransaccional) {}

  private get db() {
    return this.transaccional.cliente;
  }

  registrar(r: RegistroDispositivoPush): Promise<DispositivoPushRegistrado> {
    const datos = {
      usuarioId: r.usuarioId,
      sesionId: r.sesionId,
      token: r.token,
      proveedor: PROVEEDOR,
      plataforma: PLATAFORMA,
      nombreDispositivo: r.nombreDispositivo,
      modeloDispositivo: r.modeloDispositivo,
      versionApp: r.versionApp,
      activo: true,
      ultimoRegistroEn: r.fecha,
      revocadoEn: null,
    };

    return this.transaccional.ejecutar(async () => {
      // El token es único: la última instalación que lo presenta se queda con él.
      await this.db.usuarioPushDispositivo.deleteMany({
        where: { token: r.token, instalacionId: { not: r.instalacionId } },
      });

      const d = await this.db.usuarioPushDispositivo.upsert({
        where: { instalacionId: r.instalacionId },
        create: { ...datos, instalacionId: r.instalacionId },
        update: datos,
        select: {
          instalacionId: true,
          plataforma: true,
          activo: true,
          ultimoRegistroEn: true,
        },
      });

      return {
        instalacionId: d.instalacionId,
        plataforma: d.plataforma,
        activo: d.activo,
        registradoEn: d.ultimoRegistroEn,
      };
    });
  }

  async revocar(
    usuarioId: number,
    instalacionId: string,
    fecha: Date,
  ): Promise<boolean> {
    const { count } = await this.db.usuarioPushDispositivo.updateMany({
      where: { usuarioId, instalacionId, activo: true },
      data: { activo: false, revocadoEn: fecha },
    });

    return count > 0;
  }

  async revocarPorSesiones(
    sesionIds: readonly string[],
    fecha: Date,
  ): Promise<number> {
    const { count } = await this.db.usuarioPushDispositivo.updateMany({
      where: { sesionId: { in: [...sesionIds] }, activo: true },
      data: { activo: false, revocadoEn: fecha },
    });

    return count;
  }

  async tokensActivos(usuarioId: number): Promise<string[]> {
    const filas = await this.db.usuarioPushDispositivo.findMany({
      where: {
        usuarioId,
        activo: true,
        proveedor: PROVEEDOR,
        plataforma: PLATAFORMA,
        usuario: { activo: true },
      },
      select: { token: true },
    });

    return [...new Set(filas.map((f) => f.token.trim()).filter(Boolean))];
  }

  async desactivarTokens(
    tokens: readonly string[],
    fecha: Date,
  ): Promise<number> {
    const limpios = [...new Set(tokens.map((t) => t.trim()).filter(Boolean))];

    if (limpios.length === 0) return 0;

    const { count } = await this.db.usuarioPushDispositivo.updateMany({
      where: { token: { in: limpios }, activo: true },
      data: { activo: false, revocadoEn: fecha },
    });

    return count;
  }

  async preferencias(usuarioId: number): Promise<PreferenciasPush> {
    const perfil = await this.db.perfilUsuario.findFirst({
      where: { usuarioId },
      select: { notificarPush: true, notificarSonido: true },
    });

    return {
      push: perfil?.notificarPush ?? true,
      sonido: perfil?.notificarSonido ?? true,
    };
  }
}
