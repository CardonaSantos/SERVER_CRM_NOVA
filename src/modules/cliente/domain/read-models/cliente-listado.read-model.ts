export type NombradoReadModel = { id: number; nombre: string };

// ── Tabla de clientes ────────────────────────────────────────────────────────

export type ClienteTablaFiltros = {
  search?: string;
  zonaId?: number;
  municipioId?: number;
  departamentoId?: number;
  sectorId?: number;
  estado?: string;
  estadoCobranza?: string;
};

/** Lo que necesita la clasificación de crédito de cada factura. */
export type FacturaHistorialReadModel = {
  id: number;
  creadoEn: Date;
  fechaPagoEsperada: Date | null;
  fechaPagada: Date | null;
  estado: string;
  pagos: { id: number; montoPagado: number; fechaPago: Date }[];
};

export type ClienteTablaItem = {
  id: number;
  nombre: string;
  apellidos: string | null;
  estadoCliente: string;
  estadoCobranza: string;
  telefono: string | null;
  dpi: string | null;
  direccion: string | null;
  creadoEn: Date;
  actualizadoEn: Date;
  departamento: NombradoReadModel | null;
  municipio: NombradoReadModel | null;
  sector: NombradoReadModel | null;
  facturacionZona: NombradoReadModel | null;
  direccionIp: string | null;
  servicioInternet: {
    id: number;
    nombre: string;
    velocidad: string | null;
    precio: number;
    estado: string;
  } | null;
  facturas: FacturaHistorialReadModel[];
};

/** Cartera completa, sin los filtros de la tabla. */
export type ResumenCartera = {
  activos: number;
  pagoPendiente: number;
  atrasados: number;
  morosos: number;
};

// ── Selección de clientes para una ruta de cobro ─────────────────────────────

export type OrdenClientesRuta = 'nombre' | 'saldo';

export type ClienteRutaFiltros = {
  search?: string;
  estado?: string;
  estadoCobranza?: string;
  zonaIds?: number[];
  sectorIds?: number[];
  sortBy: OrdenClientesRuta;
  sortDir: 'asc' | 'desc';
};

export type ClienteRutaItem = {
  id: number;
  nombre: string;
  apellidos: string | null;
  telefono: string | null;
  direccion: string | null;
  estadoCliente: string;
  estadoCobranza: string;
  saldoPendiente: number;
  facturacionZona: NombradoReadModel | null;
  sector: NombradoReadModel | null;
  municipio: NombradoReadModel | null;
  facturas: {
    id: number;
    montoFactura: number;
    fechaPagoEsperada: Date | null;
  }[];
};

// ── Campañas de mensajería ───────────────────────────────────────────────────

export type ClienteCampaniaFiltros = {
  nombre?: string;
  zonaId?: number;
  sectorId?: number;
  municipioId?: number;
  departamentoId?: number;
  estado?: string;
  estadoCobranza?: string;
  /** Cantidad exacta de facturas con deuda. */
  facturasPendientes?: number;
};

export type ClienteCampaniaItem = {
  id: number;
  nombre: string;
  apellidos: string | null;
  facturasPendientes: number;
  estadoCliente: string;
  estadoCobranza: string;
  telefono: string | null;
  telefonoReferencia: string | null;
};

// ── Combos ───────────────────────────────────────────────────────────────────

export type ClienteOpcion = {
  id: number;
  nombre: string;
  apellidos: string | null;
};
