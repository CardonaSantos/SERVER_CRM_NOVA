import { PppoeAuditoriaEntity } from '../entities/pppoe-auditoria.entity';
import {
  AccionAuditoriaPppoe,
  OrigenOperacionPppoe,
} from '../enums/pppoe-auditoria.enum';
import { PppoeAuditoriaPaginatedResult } from '../read-models/pppoe-auditoria-list.read-model';

export const PPPOE_AUDITORIA_REPOSITORY = Symbol('PPPOE_AUDITORIA_REPOSITORY');

export type PppoeAuditoriaOrdenCampo = 'creadoEn' | 'accion' | 'origen';

export type PppoeAuditoriaOrdenDireccion = 'asc' | 'desc';

export type BuscarAuditoriasPppoeParams = {
  empresaId: number;

  page?: number;
  limit?: number;

  clienteId?: number;
  accesoInternetId?: number;
  cuentaPppoeId?: number;
  perfilHomologacionId?: number;

  instalacionId?: number;
  desinstalacionId?: number;
  operacionId?: number;

  operadorId?: number;

  origen?: OrigenOperacionPppoe;

  accion?: AccionAuditoriaPppoe;

  acciones?: AccionAuditoriaPppoe[];

  creadoDesde?: Date;
  creadoHasta?: Date;

  ordenPor?: PppoeAuditoriaOrdenCampo;

  ordenDireccion?: PppoeAuditoriaOrdenDireccion;

  search?: string | null;

  fechaDesde?: Date | null;
  fechaHasta?: Date | null;
};

export interface PppoeAuditoriaRepositoryPort {
  /**
   * Inserta un evento nuevo en la bitácora.
   *
   * La auditoría es append-only:
   * no se actualiza ni se elimina.
   */
  create(entity: PppoeAuditoriaEntity): Promise<PppoeAuditoriaEntity>;

  /**
   * Consulta general para pantallas administrativas,
   * reportes y bitácoras.
   */
  findPaginated(
    params: BuscarAuditoriasPppoeParams,
  ): Promise<PppoeAuditoriaPaginatedResult>;
}
