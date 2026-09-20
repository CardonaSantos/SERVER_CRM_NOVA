import { EstadoCliente } from '../../enums/cliente-report/estado-clientes-actualizado.enum';
import { EstadoCobranzaCliente } from '../../enums/cliente-report/estado-cobranza-clientes.enum';

export interface ClienteReporteFilters {
  search?: string;

  // Estado
  estado?: EstadoCliente;
  estadoCobranza?: EstadoCobranzaCliente;

  // Relaciones
  servicioInternetId?: number;
  sectorId?: number;
  municipioId?: number;
  departamentoId?: number;

  // Fechas
  fechaCreadoDesde?: Date;
  fechaCreadoHasta?: Date;

  // Soft-delete
  incluirEliminados?: boolean;
}
