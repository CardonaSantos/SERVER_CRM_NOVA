import {
  crearResultadoPaginado,
  Paginacion,
} from 'src/common/hexagonal/paginacion';

import {
  EnviadorPushPort,
  MensajePush,
  ResultadoEnvioPush,
} from '../../application/ports/enviador-push.port';
import { NotificacionEventosPort } from '../../application/ports/notificacion-eventos.port';
import { NotificacionEntity } from '../../domain/entities/notificacion.entity';
import { BandejaNotificacionRepositoryPort } from '../../domain/ports/bandeja-notificacion-repository.port';
import {
  DispositivoPushRegistrado,
  DispositivoPushRepositoryPort,
  PreferenciasPush,
  RegistroDispositivoPush,
} from '../../domain/ports/dispositivo-push-repository.port';
import {
  DestinoUsuarios,
  NotificacionQueryPort,
} from '../../domain/ports/notificacion-query.port';
import { NotificacionRepositoryPort } from '../../domain/ports/notificacion-repository.port';
import { NotificacionProps } from '../../domain/props/notificacion.props';
import {
  NotificacionBandejaFiltros,
  NotificacionBandejaItem,
} from '../../domain/read-models/notificacion-bandeja.read-model';

type FilaBandeja = {
  usuarioId: number;
  notificacionId: number;
  leidaEn: Date | null;
  descartadaEn: Date | null;
};

/**
 * Base en memoria de notificaciones: repositorio, bandeja y consulta
 * comparten estado como en la BD.
 */
export class NotificacionesEnMemoria
  implements
    NotificacionRepositoryPort,
    BandejaNotificacionRepositoryPort,
    NotificacionQueryPort
{
  readonly notificaciones = new Map<number, NotificacionProps>();
  readonly filas: FilaBandeja[] = [];

  /** Usuarios activos que conoce el fake: id → rol. */
  usuarios = new Map<number, string>();

  private siguienteId = 1;

  create(
    notificacion: NotificacionEntity,
    destinatarioIds: readonly number[],
  ): Promise<NotificacionEntity> {
    const props = { ...notificacion.toPrimitives(), id: this.siguienteId++ };

    this.notificaciones.set(props.id, props);
    for (const usuarioId of new Set(destinatarioIds)) {
      this.filas.push({
        usuarioId,
        notificacionId: props.id,
        leidaEn: null,
        descartadaEn: null,
      });
    }

    return Promise.resolve(NotificacionEntity.hydrate(props));
  }

  private enBandeja(usuarioId: number) {
    return this.filas.filter(
      (f) => f.usuarioId === usuarioId && f.descartadaEn === null,
    );
  }

  marcarLeida(usuarioId: number, notificacionId: number, fecha: Date) {
    const fila = this.enBandeja(usuarioId).find(
      (f) => f.notificacionId === notificacionId,
    );

    if (fila && !fila.leidaEn) fila.leidaEn = fecha;
    return Promise.resolve(Boolean(fila));
  }

  marcarTodasLeidas(usuarioId: number, fecha: Date) {
    const pendientes = this.enBandeja(usuarioId).filter((f) => !f.leidaEn);
    pendientes.forEach((f) => (f.leidaEn = fecha));
    return Promise.resolve(pendientes.length);
  }

  descartar(usuarioId: number, notificacionId: number, fecha: Date) {
    const fila = this.enBandeja(usuarioId).find(
      (f) => f.notificacionId === notificacionId,
    );

    if (fila) fila.descartadaEn = fecha;
    return Promise.resolve(Boolean(fila));
  }

  descartarTodas(usuarioId: number, fecha: Date) {
    const filas = this.enBandeja(usuarioId);
    filas.forEach((f) => (f.descartadaEn = fecha));
    return Promise.resolve(filas.length);
  }

  findBandeja(
    usuarioId: number,
    filtros: NotificacionBandejaFiltros,
    paginacion: Paginacion,
  ) {
    const items: NotificacionBandejaItem[] = this.enBandeja(usuarioId)
      .filter((f) => !filtros.soloNoLeidas || !f.leidaEn)
      .map((f) => {
        const n = this.notificaciones.get(f.notificacionId)!;
        return {
          id: n.id!,
          titulo: n.titulo,
          mensaje: n.mensaje,
          categoria: n.categoria,
          severidad: n.severidad,
          referencia: n.referencia,
          ruta: n.ruta,
          etiquetaAccion: n.etiquetaAccion,
          creadaEn: n.creadaEn,
          leidaEn: f.leidaEn,
        };
      })
      .filter(
        (n) =>
          !filtros.categorias?.length ||
          filtros.categorias.includes(n.categoria),
      )
      .sort((a, b) => b.id - a.id);

    const desde = (paginacion.page - 1) * paginacion.limit;

    return Promise.resolve(
      crearResultadoPaginado(
        items.slice(desde, desde + paginacion.limit),
        items.length,
        paginacion,
      ),
    );
  }

  contar(usuarioId: number) {
    return Promise.resolve({
      noLeidas: this.enBandeja(usuarioId).filter((f) => !f.leidaEn).length,
    });
  }

  resolverDestinatarios(destino: DestinoUsuarios): Promise<number[]> {
    const ids = [...this.usuarios.entries()]
      .filter(
        ([id, rol]) =>
          destino.todos ||
          destino.usuarioIds?.includes(id) ||
          destino.roles?.includes(rol),
      )
      .map(([id]) => id)
      .sort((a, b) => a - b);

    return Promise.resolve(ids);
  }
}

export class NotificacionEventosFake implements NotificacionEventosPort {
  readonly emitidas: Array<{ id: number; destinatarios: number[] }> = [];

  notificacionCreada(
    notificacion: NotificacionProps & { id: number },
    destinatarioIds: readonly number[],
  ): Promise<void> {
    this.emitidas.push({
      id: notificacion.id,
      destinatarios: [...destinatarioIds],
    });
    return Promise.resolve();
  }
}

type Dispositivo = RegistroDispositivoPush & {
  activo: boolean;
  revocadoEn: Date | null;
};

export class DispositivosPushEnMemoria
  implements DispositivoPushRepositoryPort
{
  readonly dispositivos = new Map<string, Dispositivo>();
  preferenciasPorUsuario = new Map<number, PreferenciasPush>();

  registrar(r: RegistroDispositivoPush): Promise<DispositivoPushRegistrado> {
    for (const [instalacion, d] of this.dispositivos) {
      if (d.token === r.token && instalacion !== r.instalacionId) {
        this.dispositivos.delete(instalacion);
      }
    }

    this.dispositivos.set(r.instalacionId, {
      ...r,
      activo: true,
      revocadoEn: null,
    });

    return Promise.resolve({
      instalacionId: r.instalacionId,
      plataforma: 'ANDROID',
      activo: true,
      registradoEn: r.fecha,
    });
  }

  revocar(usuarioId: number, instalacionId: string, fecha: Date) {
    const d = this.dispositivos.get(instalacionId);

    if (!d || d.usuarioId !== usuarioId || !d.activo) {
      return Promise.resolve(false);
    }

    d.activo = false;
    d.revocadoEn = fecha;
    return Promise.resolve(true);
  }

  revocarPorSesiones(sesionIds: readonly string[], fecha: Date) {
    let total = 0;

    for (const d of this.dispositivos.values()) {
      if (d.activo && sesionIds.includes(d.sesionId)) {
        d.activo = false;
        d.revocadoEn = fecha;
        total++;
      }
    }

    return Promise.resolve(total);
  }

  tokensActivos(usuarioId: number) {
    return Promise.resolve(
      [...this.dispositivos.values()]
        .filter((d) => d.usuarioId === usuarioId && d.activo)
        .map((d) => d.token),
    );
  }

  desactivarTokens(tokens: readonly string[], fecha: Date) {
    let total = 0;

    for (const d of this.dispositivos.values()) {
      if (d.activo && tokens.includes(d.token)) {
        d.activo = false;
        d.revocadoEn = fecha;
        total++;
      }
    }

    return Promise.resolve(total);
  }

  preferencias(usuarioId: number) {
    return Promise.resolve(
      this.preferenciasPorUsuario.get(usuarioId) ?? {
        push: true,
        sonido: true,
      },
    );
  }
}

export class EnviadorPushFake implements EnviadorPushPort {
  configurado = true;
  readonly enviados: MensajePush[] = [];
  /** Tokens que el proveedor dará por inválidos. */
  invalidos = new Set<string>();

  disponible(): boolean {
    return this.configurado;
  }

  enviar(mensaje: MensajePush): Promise<ResultadoEnvioPush> {
    this.enviados.push(mensaje);
    const tokensInvalidos = mensaje.tokens.filter((t) => this.invalidos.has(t));

    return Promise.resolve({
      exitosos: mensaje.tokens.length - tokensInvalidos.length,
      fallidos: tokensInvalidos.length,
      tokensInvalidos,
    });
  }
}
