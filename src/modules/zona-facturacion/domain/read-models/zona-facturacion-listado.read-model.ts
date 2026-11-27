import { DireccionOrden } from 'src/common/hexagonal/paginacion';
import { OrdenZonaFacturacion } from '../enums/orden-zona-facturacion.enum';
import { ZonaFacturacionConfiguracion } from '../props/zona-facturacion.props';

export type ZonaFacturacionFiltros = {
  /** Busca en el nombre. */
  search?: string;
  sortBy?: OrdenZonaFacturacion;
  sortDir?: DireccionOrden;
};

export type ZonaFacturacionOpcion = {
  id: number;
  nombre: string;
  /** Clientes no eliminados. */
  clientes: number;
  facturas: number;
};

export type ZonaFacturacionListItem = ZonaFacturacionConfiguracion &
  ZonaFacturacionOpcion & {
    creadoEn: Date;
    actualizadoEn: Date;
  };
