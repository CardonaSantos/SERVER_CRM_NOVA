import { EstadoRutaCobro } from '../../domain/enums/estado-ruta-cobro.enum';

export class CobradorRutaResponseDto {
  /** Id del usuario */
  id: number;
  /** Nombre */
  nombre: string;
  /** Rol del usuario */
  rol: string;
}

export class TotalesRutaCobroResponseDto {
  /** Clientes no eliminados de la ruta */
  clientes: number;
  /** Clientes con algún pago registrado en la ruta */
  clientesCobrados: number;
  /** Facturas con deuda de esos clientes */
  facturasPendientes: number;
  /** Saldo de esas facturas */
  porCobrar: number;
  /** Pagos registrados en la ruta desde que se creó */
  cobrado: number;
}

/** Respuesta de crear, editar y cerrar. */
export class RutaCobroResponseDto {
  /** Id de la ruta */
  id: number;
  /** Nombre de la ruta */
  nombre: string;
  /** Estado */
  estado: EstadoRutaCobro;
  /** Id del cobrador asignado */
  cobradorId: number | null;
  /** Notas */
  observaciones: string | null;
  /** Creación (ISO 8601) */
  creadoEn: string;
  /** Último cambio (ISO 8601) */
  actualizadoEn: string;
}

export class RutaCobroResumenResponseDto {
  /** Id de la ruta */
  id: number;
  /** Nombre de la ruta */
  nombre: string;
  /** Estado */
  estado: EstadoRutaCobro;
  /** Notas */
  observaciones: string | null;
  /** Cobrador asignado */
  cobrador: CobradorRutaResponseDto | null;
  /** Creación (ISO 8601) */
  creadoEn: string;
  /** Último cambio (ISO 8601) */
  actualizadoEn: string;
  /** Totales calculados al consultar */
  totales: TotalesRutaCobroResponseDto;
}

export class ClienteDeRutaResponseDto {
  /** Id del cliente */
  id: number;
  /** Nombre y apellidos */
  nombreCompleto: string;
  /** Teléfono */
  telefono: string | null;
  /** Dirección */
  direccion: string | null;
  /** Estado del servicio */
  estadoCliente: string;
  /** Zona de facturación */
  zonaFacturacion: { id: number; nombre: string } | null;
  /** Coordenadas */
  ubicacion: { latitud: number; longitud: number } | null;
  /** Lo que debe */
  saldoPendiente: number;
  /** Cuántas facturas debe */
  facturasPendientes: number;
}

/** Pantalla de administración y edición de una ruta. */
export class RutaCobroDetalleResponseDto extends RutaCobroResumenResponseDto {
  /** Primero los que más deben */
  clientes: ClienteDeRutaResponseDto[];
}

export class FacturaPorCobrarResponseDto {
  /** Id de la factura */
  id: number;
  /** Mes facturado, `YYYYMM` */
  periodo: string;
  /** Monto de la factura */
  montoPago: number;
  /** Lo que falta pagar */
  saldoPendiente: number;
  /** PENDIENTE, PARCIAL o VENCIDA */
  estadoFacturaInternet: string;
  /** Detalle */
  detalleFactura: string | null;
  /** Creación (ISO 8601) */
  creadoEn: string;
  /** Vencimiento (ISO 8601) */
  fechaPagoEsperada: string | null;
}

export class ClienteEnCobroResponseDto {
  /** Id del cliente */
  id: number;
  /** Nombre y apellidos */
  nombreCompleto: string;
  /** Teléfono */
  telefono: string | null;
  /** Dirección */
  direccion: string | null;
  /** Persona de referencia */
  contactoReferencia: { nombre: string | null; telefono: string | null };
  /** Coordenadas */
  ubicacion: { latitud: number; longitud: number } | null;
  /** Lo que debe */
  saldoPendiente: number;
  /** Último pago (ISO 8601) */
  ultimoPago: string | null;
  /** Facturas con deuda, la más antigua primero */
  facturas: FacturaPorCobrarResponseDto[];
}

/** Pantalla de cobro en calle. */
export class RutaEnCobroResponseDto extends RutaCobroResumenResponseDto {
  /** Primero los que más deben */
  clientes: ClienteEnCobroResponseDto[];
}

export class RutasAsignadasResponseDto {
  /** Rutas abiertas del usuario */
  rutas: RutaCobroResumenResponseDto[];
  /** Suma de las rutas listadas */
  totales: { rutas: number; clientes: number };
}

export class RutaCobroEliminadaResponseDto {
  /** Ruta eliminada */
  rutaId: number;
  /** Momento de la eliminación (ISO 8601) */
  eliminadoEn: string;
}
