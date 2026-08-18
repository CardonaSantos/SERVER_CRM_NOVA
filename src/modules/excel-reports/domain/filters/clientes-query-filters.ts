import { EstadoCliente } from '../../domain/enums/estado-clientes-actualizado.enum';
import { EstadoCobranzaCliente } from '../../domain/enums/estado-cobranza-clientes.enum';

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
