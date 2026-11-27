import { ZonaFacturacionEntity } from '../entities/zona-facturacion.entity';

export const ZONA_FACTURACION_REPOSITORY = Symbol(
  'ZONA_FACTURACION_REPOSITORY',
);

export type UsoZonaFacturacion = {
  /** Incluye los clientes eliminados: la zona es parte de su bitácora. */
  clientes: number;
  facturas: number;
};

export interface ZonaFacturacionRepositoryPort {
  /** Devuelve también las eliminadas. */
  findById(id: number): Promise<ZonaFacturacionEntity | null>;

  create(entity: ZonaFacturacionEntity): Promise<ZonaFacturacionEntity>;

  /**
   * Guarda la configuración de una zona activa.
   * @throws ZonaFacturacionModificadaError si ya no está activa.
   */
  update(entity: ZonaFacturacionEntity): Promise<ZonaFacturacionEntity>;

  contarUso(id: number): Promise<UsoZonaFacturacion>;

  /**
   * Guarda el borrado lógico solo si la zona sigue activa y sin clientes ni
   * facturas. Nunca borra la fila.
   * @throws ZonaFacturacionModificadaError si dejó de cumplirlo.
   */
  eliminar(entity: ZonaFacturacionEntity): Promise<void>;
}
