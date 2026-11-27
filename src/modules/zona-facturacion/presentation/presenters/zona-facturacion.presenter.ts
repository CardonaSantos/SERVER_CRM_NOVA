import {
  presentarPaginado,
  RespuestaPaginada,
  ResultadoPaginado,
} from 'src/common/hexagonal/paginacion';
import { EliminarZonaFacturacionResult } from '../../application/use-cases/eliminar-zona-facturacion.use-case';
import { ZonaFacturacionProps } from '../../domain/props/zona-facturacion.props';
import {
  ZonaFacturacionListItem,
  ZonaFacturacionOpcion,
} from '../../domain/read-models/zona-facturacion-listado.read-model';
import {
  ZonaFacturacionEliminadaResponseDto,
  ZonaFacturacionListadoResponseDto,
  ZonaFacturacionOpcionResponseDto,
  ZonaFacturacionResponseDto,
} from '../dto/zona-facturacion-response.dto';

export class ZonaFacturacionPresenter {
  static detalle(
    zona: ZonaFacturacionProps | ZonaFacturacionListItem,
  ): ZonaFacturacionResponseDto {
    return {
      id: zona.id!,
      nombre: zona.nombre,
      diaGeneracionFactura: zona.diaGeneracionFactura,
      diaPago: zona.diaPago,
      diaRecordatorio: zona.diaRecordatorio,
      diaSegundoRecordatorio: zona.diaSegundoRecordatorio,
      diaCorte: zona.diaCorte,
      suspenderTrasFacturas: zona.suspenderTrasFacturas,
      enviarRecordatorio: zona.enviarRecordatorio,
      enviarRecordatorioGeneracion: zona.enviarRecordatorioGeneracion,
      enviarAvisoPago: zona.enviarAvisoPago,
      enviarRecordatorio1: zona.enviarRecordatorio1,
      enviarRecordatorio2: zona.enviarRecordatorio2,
      creadoEn: zona.creadoEn.toISOString(),
      actualizadoEn: zona.actualizadoEn.toISOString(),
    };
  }

  static item(
    zona: ZonaFacturacionListItem,
  ): ZonaFacturacionListadoResponseDto {
    return {
      ...ZonaFacturacionPresenter.detalle(zona),
      clientesCount: zona.clientes,
      facturasCount: zona.facturas,
    };
  }

  static listado(
    resultado: ResultadoPaginado<ZonaFacturacionListItem>,
  ): RespuestaPaginada<ZonaFacturacionListadoResponseDto> {
    return presentarPaginado(resultado, (zona) =>
      ZonaFacturacionPresenter.item(zona),
    );
  }

  static opcion(zona: ZonaFacturacionOpcion): ZonaFacturacionOpcionResponseDto {
    return {
      id: zona.id,
      nombre: zona.nombre,
      clientesCount: zona.clientes,
      facturasCount: zona.facturas,
    };
  }

  static eliminada(
    resultado: EliminarZonaFacturacionResult,
  ): ZonaFacturacionEliminadaResponseDto {
    return {
      zonaId: resultado.zonaId,
      eliminadoEn: resultado.eliminadoEn.toISOString(),
    };
  }
}
