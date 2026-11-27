import { EstadoFactura } from '../enums/estado-factura.enum';
import { MetodoPago } from '../enums/metodo-pago.enum';

export type FacturaFiltros = {
  /** Cada palabra debe aparecer en el nombre, teléfono, IP, sector o dirección. */
  search?: string;
  zonaId?: number;
  municipioId?: number;
  departamentoId?: number;
  sectorId?: number;
  estado?: EstadoFactura;
};

export type Referencia = { id: number; nombre: string };

export type FacturaListItem = {
  id: number;
  estado: EstadoFactura;
  cliente: { id: number; nombre: string; telefono: string | null };
  direccionIp: string | null;
  sector: Referencia | null;
  municipioId: number | null;
  departamentoId: number | null;
  facturacionZonaId: number | null;
  montoPago: number;
  saldoPendiente: number;
  creadoEn: Date;
  fechaPagoEsperada: Date | null;
  /** Quienes cobraron algún pago, sin repetir. */
  cobradores: string[];
};

/** Conteos con los filtros vigentes (sin el de estado ni las anuladas). */
export type ResumenFacturas = {
  facturadas: number;
  cobradas: number;
  porCobrar: number;
};

export type UsuarioFactura = { id: number; nombre: string; rol: string };

export type PagoDeFactura = {
  id: number;
  montoPagado: number;
  metodoPago: MetodoPago;
  numeroBoleta: string | null;
  fechaPago: Date;
  creadoEn: Date;
  cobrador: UsuarioFactura | null;
};

/** Pantalla de cobro de una factura. */
export type FacturaDetalle = {
  id: number;
  estado: EstadoFactura;
  periodo: string;
  montoPago: number;
  saldoPendiente: number;
  detalleFactura: string | null;
  creadoEn: Date;
  fechaPagoEsperada: Date | null;
  fechaPagada: Date | null;
  creador: UsuarioFactura | null;
  cliente: {
    id: number;
    nombre: string;
    apellidos: string | null;
    telefono: string | null;
    direccion: string | null;
    dpi: string | null;
    estadoCliente: string;
    servicioInternet: {
      id: number;
      nombre: string;
      velocidad: string | null;
      precio: number;
    } | null;
    facturacionZona: Referencia | null;
  };
  pagos: PagoDeFactura[];
  recordatorios: { id: number; fechaEnvio: Date; medioEnvio: string }[];
  /** Las demás facturas que el cliente debe, de la más nueva a la más vieja. */
  facturasPendientes: {
    id: number;
    estado: EstadoFactura;
    montoPago: number;
    saldoPendiente: number;
    fechaPagoEsperada: Date | null;
  }[];
};

export type FacturaImpresion = {
  id: number;
  estado: EstadoFactura;
  periodo: string;
  montoPago: number;
  saldoPendiente: number;
  detalleFactura: string | null;
  creadoEn: Date;
  fechaPagoEsperada: Date | null;
  cliente: {
    id: number;
    nombre: string;
    apellidos: string | null;
    dpi: string | null;
  };
  empresa: {
    nombre: string;
    direccion: string | null;
    correo: string | null;
    pbx: string | null;
    sitioWeb: string | null;
    telefono: string | null;
    nit: string | null;
  };
  pagos: Omit<PagoDeFactura, 'cobrador'>[];
};

export type FacturaEdicion = {
  id: number;
  estado: EstadoFactura;
  montoPago: number;
  saldoPendiente: number;
  totalPagado: number;
  detalleFactura: string | null;
  creadoEn: Date;
  actualizadoEn: Date;
  fechaPagoEsperada: Date | null;
  fechaPagada: Date | null;
  cliente: {
    id: number;
    nombre: string;
    apellidos: string | null;
    estadoCliente: string;
  };
};

export type FacturaEliminadaItem = {
  id: number;
  /** `null` en las eliminadas antes de guardar este dato. */
  facturaId: number | null;
  clienteId: number;
  periodo: string;
  montoPago: number;
  fechaPagoEsperada: Date;
  fechaEliminacion: Date;
  motivo: string | null;
  usuario: UsuarioFactura;
};
