import { DireccionOrden } from 'src/common/hexagonal/paginacion';
import { EstadoRutaCobro } from '../enums/estado-ruta-cobro.enum';
import { OrdenRutaCobro } from '../enums/orden-ruta-cobro.enum';
import { TotalesRutaCobro } from '../policies/totales-ruta.policy';

export type RutaCobroFiltros = {
  /** Busca en el nombre. */
  search?: string;
  estados?: EstadoRutaCobro[];
  cobradorId?: number;
  sortBy?: OrdenRutaCobro;
  sortDir?: DireccionOrden;
};

export type CobradorRuta = { id: number; nombre: string; rol: string };

export type RutaCobroResumen = {
  id: number;
  nombre: string;
  estado: EstadoRutaCobro;
  observaciones: string | null;
  cobrador: CobradorRuta | null;
  creadoEn: Date;
  actualizadoEn: Date;
  totales: TotalesRutaCobro;
};

export type FacturaPorCobrar = {
  id: number;
  periodo: string;
  montoPago: number;
  saldoPendiente: number;
  estado: string;
  detalleFactura: string | null;
  creadoEn: Date;
  fechaPagoEsperada: Date | null;
};

export type ClienteDeRuta = {
  id: number;
  nombre: string;
  apellidos: string | null;
  telefono: string | null;
  direccion: string | null;
  contactoReferencia: { nombre: string | null; telefono: string | null };
  estadoCliente: string;
  zonaFacturacion: { id: number; nombre: string } | null;
  sector: string | null;
  plan: string | null;
  fechaInstalacion: Date | null;
  observaciones: string | null;
  ubicacion: { latitud: number; longitud: number } | null;
  saldoPendiente: number;
  /** Último pago del cliente, se haya hecho o no en una ruta. */
  ultimoPago: Date | null;
  facturas: FacturaPorCobrar[];
};

/** La ruta con sus clientes no eliminados, primero los que más deben. */
export type RutaCobroDetalle = RutaCobroResumen & {
  clientes: ClienteDeRuta[];
};
