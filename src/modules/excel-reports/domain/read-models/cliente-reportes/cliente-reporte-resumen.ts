import { EstadoCliente } from '../../enums/estado-clientes-actualizado.enum';
import { EstadoCobranzaCliente } from '../../enums/estado-cobranza-clientes.enum';

export interface ReporteCantidadPorCategoria<T extends string> {
  categoria: T;
  total: number;
}

export interface ClienteReporteResumen {
  totalClientes: number;
  carteraActual: number;

  porEstadoCliente: Array<ReporteCantidadPorCategoria<EstadoCliente>>;

  porEstadoCobranza: Array<ReporteCantidadPorCategoria<EstadoCobranzaCliente>>;

  instalaciones: {
    total: number;

    porEstado: Array<ReporteCantidadPorCategoria<string>>;
  };

  desinstalaciones: {
    total: number;

    porEstado: Array<ReporteCantidadPorCategoria<string>>;
  };
}
