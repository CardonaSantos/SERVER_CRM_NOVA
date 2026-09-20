import {
  PppoeAuditoriaInstalacionFindFilters,
  PppoeAuditoriaInstalacionPaginatedResult,
} from '../read-models/pppoe-auditoria-instalacion.read-model';

export const PPPOE_AUDITORIA_INSTALACION_QUERY = Symbol(
  'PPPOE_AUDITORIA_INSTALACION_QUERY',
);

export interface PppoeAuditoriaInstalacionQueryPort {
  findTimelineByInstalacion(
    filters: PppoeAuditoriaInstalacionFindFilters,
  ): Promise<PppoeAuditoriaInstalacionPaginatedResult | null>;
}
