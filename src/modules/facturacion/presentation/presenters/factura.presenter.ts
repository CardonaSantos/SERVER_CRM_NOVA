import {
  presentarPaginado,
  ResultadoPaginado,
} from 'src/common/hexagonal/paginacion';
import { PagoRegistrado } from '../../application/services/registrador-pagos.service';
import { EliminarFacturaResult } from '../../application/use-cases/eliminar-factura.use-case';
import { EliminarPagoResult } from '../../application/use-cases/eliminar-pago.use-case';
import { ListarFacturasResult } from '../../application/use-cases/listar-facturas.use-case';
import { FacturaProps } from '../../domain/props/factura.props';
import {
  FacturaDetalle,
  FacturaEdicion,
  FacturaEliminadaItem,
  FacturaImpresion,
  FacturaListItem,
  PagoDeFactura,
  UsuarioFactura,
} from '../../domain/read-models/factura.read-model';

const fecha = (valor: Date | null): string | null =>
  valor ? valor.toISOString() : null;

const usuario = (u: UsuarioFactura | null) =>
  u ? { id: u.id, nombre: u.nombre, rol: u.rol } : null;

const pago = (p: Omit<PagoDeFactura, 'cobrador'>) => ({
  id: p.id,
  montoPagado: p.montoPagado,
  metodoPago: p.metodoPago,
  numeroBoleta: p.numeroBoleta,
  fechaPago: p.fechaPago.toISOString(),
  creadoEn: p.creadoEn.toISOString(),
});

export class FacturaPresenter {
  static pagoRegistrado(r: PagoRegistrado) {
    return {
      pagoId: r.pagoId,
      facturaId: r.facturaId,
      estadoFacturaInternet: r.estadoFactura,
      saldoPendiente: r.saldoPendiente,
      estadoCobranza: r.estadoCobranza,
    };
  }

  static pagoEliminado(r: EliminarPagoResult) {
    return FacturaPresenter.pagoRegistrado(r);
  }

  static eliminada(r: EliminarFacturaResult) {
    return {
      facturaId: r.facturaId,
      clienteId: r.clienteId,
      estadoCobranza: r.estadoCobranza,
    };
  }

  static guardada(f: FacturaProps) {
    return {
      id: f.id!,
      clienteId: f.clienteId,
      periodo: f.periodo,
      estadoFacturaInternet: f.estado,
      montoPago: f.montoPago,
      saldoPendiente: f.saldoPendiente,
      detalleFactura: f.detalleFactura,
      fechaPagoEsperada: fecha(f.fechaPagoEsperada),
      fechaPagada: fecha(f.fechaPagada),
    };
  }

  static item(f: FacturaListItem) {
    return {
      id: f.id,
      estadoFacturaInternet: f.estado,
      cliente: {
        id: f.cliente.id,
        nombre: f.cliente.nombre,
        telefono: f.cliente.telefono,
      },
      direccionIp: f.direccionIp,
      sector: f.sector && { id: f.sector.id, nombre: f.sector.nombre },
      municipioId: f.municipioId,
      departamentoId: f.departamentoId,
      facturacionZonaId: f.facturacionZonaId,
      montoPago: f.montoPago,
      saldoPendiente: f.saldoPendiente,
      creadoEn: f.creadoEn.toISOString(),
      fechaPagoEsperada: fecha(f.fechaPagoEsperada),
      cobradores: [...f.cobradores],
    };
  }

  static listado({ facturas, resumen }: ListarFacturasResult) {
    return {
      ...presentarPaginado(facturas, (f) => FacturaPresenter.item(f)),
      resumen: {
        facturadas: resumen.facturadas,
        cobradas: resumen.cobradas,
        porCobrar: resumen.porCobrar,
      },
    };
  }

  static detalle(f: FacturaDetalle) {
    const c = f.cliente;

    return {
      id: f.id,
      estadoFacturaInternet: f.estado,
      periodo: f.periodo,
      montoPago: f.montoPago,
      saldoPendiente: f.saldoPendiente,
      detalleFactura: f.detalleFactura,
      creadoEn: f.creadoEn.toISOString(),
      fechaPagoEsperada: fecha(f.fechaPagoEsperada),
      fechaPagada: fecha(f.fechaPagada),
      creador: usuario(f.creador),
      clienteId: c.id,
      cliente: {
        id: c.id,
        nombre: c.nombre,
        apellidos: c.apellidos,
        telefono: c.telefono,
        direccion: c.direccion,
        dpi: c.dpi,
        estadoCliente: c.estadoCliente,
        servicioInternet: c.servicioInternet && {
          id: c.servicioInternet.id,
          nombre: c.servicioInternet.nombre,
          velocidad: c.servicioInternet.velocidad,
          precio: c.servicioInternet.precio,
        },
        facturacionZona: c.facturacionZona && {
          id: c.facturacionZona.id,
          nombre: c.facturacionZona.nombre,
        },
      },
      pagos: f.pagos.map((p) => ({
        ...pago(p),
        cobrador: usuario(p.cobrador),
      })),
      recordatorios: f.recordatorios.map((r) => ({
        id: r.id,
        fechaEnvio: r.fechaEnvio.toISOString(),
        medioEnvio: r.medioEnvio,
      })),
      facturasPendientes: f.facturasPendientes.map((p) => ({
        id: p.id,
        estadoFacturaInternet: p.estado,
        montoPago: p.montoPago,
        saldoPendiente: p.saldoPendiente,
        fechaPagoEsperada: fecha(p.fechaPagoEsperada),
      })),
    };
  }

  static impresion(f: FacturaImpresion) {
    const e = f.empresa;

    return {
      id: f.id,
      estadoFacturaInternet: f.estado,
      periodo: f.periodo,
      montoPago: f.montoPago,
      saldoPendiente: f.saldoPendiente,
      detalleFactura: f.detalleFactura,
      creadoEn: f.creadoEn.toISOString(),
      fechaPagoEsperada: fecha(f.fechaPagoEsperada),
      cliente: {
        id: f.cliente.id,
        nombre: f.cliente.nombre,
        apellidos: f.cliente.apellidos,
        dpi: f.cliente.dpi,
      },
      empresa: {
        nombre: e.nombre,
        direccion: e.direccion,
        correo: e.correo,
        pbx: e.pbx,
        sitioWeb: e.sitioWeb,
        telefono: e.telefono,
        nit: e.nit,
      },
      pagos: f.pagos.map((p) => pago(p)),
    };
  }

  static edicion(f: FacturaEdicion) {
    return {
      id: f.id,
      estadoFacturaInternet: f.estado,
      montoPago: f.montoPago,
      saldoPendiente: f.saldoPendiente,
      totalPagado: f.totalPagado,
      detalleFactura: f.detalleFactura,
      creadoEn: f.creadoEn.toISOString(),
      actualizadoEn: f.actualizadoEn.toISOString(),
      fechaPagoEsperada: fecha(f.fechaPagoEsperada),
      fechaPagada: fecha(f.fechaPagada),
      cliente: {
        id: f.cliente.id,
        nombre: f.cliente.nombre,
        apellidos: f.cliente.apellidos,
        estadoCliente: f.cliente.estadoCliente,
      },
    };
  }

  static registroEliminado(f: FacturaEliminadaItem) {
    return {
      id: f.id,
      facturaId: f.facturaId,
      clienteId: f.clienteId,
      periodo: f.periodo,
      montoPago: f.montoPago,
      fechaPagoEsperada: f.fechaPagoEsperada.toISOString(),
      fechaEliminacion: f.fechaEliminacion.toISOString(),
      motivo: f.motivo,
      usuario: usuario(f.usuario),
    };
  }

  static eliminadas(resultado: ResultadoPaginado<FacturaEliminadaItem>) {
    return presentarPaginado(resultado, (f) =>
      FacturaPresenter.registroEliminado(f),
    );
  }
}
