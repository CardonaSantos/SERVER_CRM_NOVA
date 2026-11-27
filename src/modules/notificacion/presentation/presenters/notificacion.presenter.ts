import {
  presentarPaginado,
  RespuestaPaginada,
  ResultadoPaginado,
} from 'src/common/hexagonal/paginacion';

import { DispositivoPushRegistrado } from '../../domain/ports/dispositivo-push-repository.port';
import {
  ContadoresNotificacion,
  NotificacionBandejaItem,
} from '../../domain/read-models/notificacion-bandeja.read-model';
import {
  ContadoresNotificacionResponseDto,
  DispositivoPushResponseDto,
  DispositivoPushRevocadoResponseDto,
  NotificacionAccionResponseDto,
  NotificacionesDescartadasResponseDto,
  NotificacionesMarcadasResponseDto,
  NotificacionResponseDto,
} from '../dto/notificacion-response.dto';

export class NotificacionPresenter {
  static item(n: NotificacionBandejaItem): NotificacionResponseDto {
    return {
      id: n.id,
      titulo: n.titulo,
      mensaje: n.mensaje,
      categoria: n.categoria,
      severidad: n.severidad,
      referencia: n.referencia
        ? { tipo: n.referencia.tipo, id: n.referencia.id }
        : null,
      ruta: n.ruta,
      etiquetaAccion: n.etiquetaAccion,
      creadaEn: n.creadaEn.toISOString(),
      leida: n.leidaEn !== null,
      leidaEn: n.leidaEn ? n.leidaEn.toISOString() : null,
    };
  }

  static bandeja(
    resultado: ResultadoPaginado<NotificacionBandejaItem>,
  ): RespuestaPaginada<NotificacionResponseDto> {
    return presentarPaginado(resultado, NotificacionPresenter.item);
  }

  static contadores(
    c: ContadoresNotificacion,
  ): ContadoresNotificacionResponseDto {
    return { noLeidas: c.noLeidas };
  }

  static accion(r: { notificacionId: number }): NotificacionAccionResponseDto {
    return { notificacionId: r.notificacionId };
  }

  static marcadas(r: { marcadas: number }): NotificacionesMarcadasResponseDto {
    return { marcadas: r.marcadas };
  }

  static descartadas(r: {
    descartadas: number;
  }): NotificacionesDescartadasResponseDto {
    return { descartadas: r.descartadas };
  }

  static dispositivo(d: DispositivoPushRegistrado): DispositivoPushResponseDto {
    return {
      instalacionId: d.instalacionId,
      plataforma: d.plataforma,
      activo: d.activo,
      registradoEn: d.registradoEn.toISOString(),
    };
  }

  static dispositivoRevocado(r: {
    instalacionId: string;
    revocado: boolean;
  }): DispositivoPushRevocadoResponseDto {
    return { instalacionId: r.instalacionId, revocado: r.revocado };
  }
}
