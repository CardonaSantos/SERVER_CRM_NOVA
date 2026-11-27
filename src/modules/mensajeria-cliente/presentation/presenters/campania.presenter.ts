import {
  presentarPaginado,
  RespuestaPaginada,
  ResultadoPaginado,
} from 'src/common/hexagonal/paginacion';
import {
  CampaniaReadModel,
  EnvioListItem,
} from '../../domain/read-models/campania.read-model';
import {
  CampaniaResponseDto,
  EnvioCampaniaResponseDto,
} from '../dto/campania-response.dto';

export class CampaniaPresenter {
  static item(c: CampaniaReadModel): CampaniaResponseDto {
    return {
      id: c.id,
      plantilla: c.plantilla,
      idioma: c.idioma,
      imagenUrl: c.imagenUrl,
      estado: c.estado,
      creadaEn: c.creadoEn.toISOString(),
      finalizadaEn: c.finalizadaEn?.toISOString() ?? null,
      creadaPor: c.creadoPor && {
        id: c.creadoPor.id,
        nombre: c.creadoPor.nombre,
      },
      totales: {
        total: c.totales.total,
        pendientes: c.totales.pendientes,
        enviados: c.totales.enviados,
        fallidos: c.totales.fallidos,
        omitidos: c.totales.omitidos,
        sinConfirmar: c.totales.sinConfirmar,
      },
    };
  }

  static listado(
    pagina: ResultadoPaginado<CampaniaReadModel>,
  ): RespuestaPaginada<CampaniaResponseDto> {
    return presentarPaginado(pagina, CampaniaPresenter.item);
  }

  static envio(e: EnvioListItem): EnvioCampaniaResponseDto {
    return {
      id: e.id,
      clienteId: e.clienteId,
      cliente: e.cliente,
      telefono: e.telefono,
      estado: e.estado,
      motivo: e.motivo,
      detalle: e.detalle,
      intentadoEn: e.intentadoEn?.toISOString() ?? null,
    };
  }

  static envios(
    pagina: ResultadoPaginado<EnvioListItem>,
  ): RespuestaPaginada<EnvioCampaniaResponseDto> {
    return presentarPaginado(pagina, CampaniaPresenter.envio);
  }
}
