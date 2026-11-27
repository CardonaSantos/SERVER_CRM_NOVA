import {
  presentarPaginado,
  RespuestaPaginada,
  ResultadoPaginado,
} from 'src/common/hexagonal/paginacion';
import { EliminarRutaCobroResult } from '../../application/use-cases/eliminar-ruta-cobro.use-case';
import { ListarRutasAsignadasResult } from '../../application/use-cases/listar-rutas-asignadas.use-case';
import { RutaCobroProps } from '../../domain/props/ruta-cobro.props';
import {
  ClienteDeRuta,
  FacturaPorCobrar,
  RutaCobroDetalle,
  RutaCobroResumen,
} from '../../domain/read-models/ruta-cobro.read-model';
import {
  FacturaPorCobrarResponseDto,
  RutaCobroDetalleResponseDto,
  RutaCobroEliminadaResponseDto,
  RutaCobroResponseDto,
  RutaCobroResumenResponseDto,
  RutaEnCobroResponseDto,
  RutasAsignadasResponseDto,
} from '../dto/ruta-cobro-response.dto';

const nombreCompleto = (c: ClienteDeRuta): string =>
  [c.nombre, c.apellidos].filter(Boolean).join(' ');

const ubicacion = (c: ClienteDeRuta) =>
  c.ubicacion && {
    latitud: c.ubicacion.latitud,
    longitud: c.ubicacion.longitud,
  };

const factura = (f: FacturaPorCobrar): FacturaPorCobrarResponseDto => ({
  id: f.id,
  periodo: f.periodo,
  montoPago: f.montoPago,
  saldoPendiente: f.saldoPendiente,
  estadoFacturaInternet: f.estado,
  detalleFactura: f.detalleFactura,
  creadoEn: f.creadoEn.toISOString(),
  fechaPagoEsperada: f.fechaPagoEsperada?.toISOString() ?? null,
});

export class RutaCobroPresenter {
  static guardada(ruta: RutaCobroProps): RutaCobroResponseDto {
    return {
      id: ruta.id!,
      nombre: ruta.nombre,
      estado: ruta.estado,
      cobradorId: ruta.cobradorId,
      observaciones: ruta.observaciones,
      creadoEn: ruta.creadoEn.toISOString(),
      actualizadoEn: ruta.actualizadoEn.toISOString(),
    };
  }

  static item(ruta: RutaCobroResumen): RutaCobroResumenResponseDto {
    return {
      id: ruta.id,
      nombre: ruta.nombre,
      estado: ruta.estado,
      observaciones: ruta.observaciones,
      cobrador: ruta.cobrador && {
        id: ruta.cobrador.id,
        nombre: ruta.cobrador.nombre,
        rol: ruta.cobrador.rol,
      },
      creadoEn: ruta.creadoEn.toISOString(),
      actualizadoEn: ruta.actualizadoEn.toISOString(),
      totales: {
        clientes: ruta.totales.clientes,
        clientesCobrados: ruta.totales.clientesCobrados,
        facturasPendientes: ruta.totales.facturasPendientes,
        porCobrar: ruta.totales.porCobrar,
        cobrado: ruta.totales.cobrado,
      },
    };
  }

  static listado(
    resultado: ResultadoPaginado<RutaCobroResumen>,
  ): RespuestaPaginada<RutaCobroResumenResponseDto> {
    return presentarPaginado(resultado, (ruta) =>
      RutaCobroPresenter.item(ruta),
    );
  }

  static detalle(ruta: RutaCobroDetalle): RutaCobroDetalleResponseDto {
    return {
      ...RutaCobroPresenter.item(ruta),
      clientes: ruta.clientes.map((c) => ({
        id: c.id,
        nombreCompleto: nombreCompleto(c),
        telefono: c.telefono,
        direccion: c.direccion,
        estadoCliente: c.estadoCliente,
        zonaFacturacion: c.zonaFacturacion && {
          id: c.zonaFacturacion.id,
          nombre: c.zonaFacturacion.nombre,
        },
        ubicacion: ubicacion(c),
        saldoPendiente: c.saldoPendiente,
        facturasPendientes: c.facturas.length,
      })),
    };
  }

  static enCobro(ruta: RutaCobroDetalle): RutaEnCobroResponseDto {
    return {
      ...RutaCobroPresenter.item(ruta),
      clientes: ruta.clientes.map((c) => ({
        id: c.id,
        nombreCompleto: nombreCompleto(c),
        telefono: c.telefono,
        direccion: c.direccion,
        contactoReferencia: {
          nombre: c.contactoReferencia.nombre,
          telefono: c.contactoReferencia.telefono,
        },
        ubicacion: ubicacion(c),
        saldoPendiente: c.saldoPendiente,
        ultimoPago: c.ultimoPago?.toISOString() ?? null,
        facturas: c.facturas.map((f) => factura(f)),
      })),
    };
  }

  static asignadas(
    resultado: ListarRutasAsignadasResult,
  ): RutasAsignadasResponseDto {
    return {
      rutas: resultado.rutas.map((ruta) => RutaCobroPresenter.item(ruta)),
      totales: {
        rutas: resultado.totales.rutas,
        clientes: resultado.totales.clientes,
      },
    };
  }

  static eliminada(
    resultado: EliminarRutaCobroResult,
  ): RutaCobroEliminadaResponseDto {
    return {
      rutaId: resultado.rutaId,
      eliminadoEn: resultado.eliminadoEn.toISOString(),
    };
  }
}
