import {
  EliminarMediaResult,
  SubirMediaResult,
} from '../../public/almacenamiento-media.facade.port';

/** Forma HTTP de las respuestas de /media (la misma de antes). */
export class MediaPresenter {
  static item(r: SubirMediaResult) {
    return {
      id: r.id,
      cdnUrl: r.cdnUrl,
      bucket: r.bucket,
      key: r.key,
      tipo: r.tipo,
    };
  }

  static lote(resultados: SubirMediaResult[]) {
    return {
      count: resultados.length,
      items: resultados.map((r) => MediaPresenter.item(r)),
    };
  }

  static eliminado(r: EliminarMediaResult) {
    return { id: r.id, eliminado: r.eliminado };
  }
}
