import { SectorEntity } from '../entities/sector.entity';

export const SECTOR_REPOSITORY = Symbol('SECTOR_REPOSITORY');

/**
 * Los bloqueos solo tienen efecto dentro de una unidad de trabajo y duran hasta
 * que termina.
 */
export interface SectorRepositoryPort {
  /** Devuelve también los eliminados. */
  findById(id: number): Promise<SectorEntity | null>;

  create(entity: SectorEntity): Promise<SectorEntity>;

  /**
   * Guarda los datos de un sector vigente.
   * @throws SectorModificadoError si ya no está vigente.
   */
  update(entity: SectorEntity): Promise<SectorEntity>;

  /** Impide que dos operaciones revisen y escriban nombres a la vez. */
  bloquearNombres(): Promise<void>;

  /** Entre los vigentes del municipio, sin distinguir mayúsculas. */
  existeNombre(
    nombre: string,
    municipioId: number,
    excluirId?: number,
  ): Promise<boolean>;

  /**
   * Impide que el sector se modifique o elimine mientras se asigna. Varias
   * asignaciones conviven. No falla si no existe.
   */
  bloquearParaAsignar(id: number): Promise<void>;

  /** Espera a quien lo esté asignando o modificando. No falla si no existe. */
  bloquearParaModificar(id: number): Promise<void>;

  /** Incluye los eliminados: el sector es parte de su bitácora. */
  contarClientes(id: number): Promise<number>;

  /**
   * Guarda el borrado lógico solo si el sector sigue vigente y sin clientes.
   * Nunca borra la fila.
   * @throws SectorModificadoError si dejó de cumplirlo.
   */
  eliminar(entity: SectorEntity): Promise<void>;
}
