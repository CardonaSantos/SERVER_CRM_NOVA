import { ServicioAdicionalEntity } from '../entities/servicio-adicional.entity';

export const SERVICIO_ADICIONAL_REPOSITORY = Symbol(
  'SERVICIO_ADICIONAL_REPOSITORY',
);

export type UsoServicioAdicional = {
  /** Incluye las asignaciones de clientes eliminados. */
  clientes: number;
  facturas: number;
};

/**
 * Los bloqueos solo tienen efecto dentro de una unidad de trabajo y duran hasta
 * que termina.
 */
export interface ServicioAdicionalRepositoryPort {
  /** Devuelve también los eliminados. */
  findById(id: number): Promise<ServicioAdicionalEntity | null>;

  create(entity: ServicioAdicionalEntity): Promise<ServicioAdicionalEntity>;

  /**
   * Guarda los datos de un servicio vigente.
   * @throws ServicioAdicionalModificadoError si ya no está vigente.
   */
  update(entity: ServicioAdicionalEntity): Promise<ServicioAdicionalEntity>;

  /** Impide que dos operaciones revisen y escriban nombres a la vez. */
  bloquearNombres(): Promise<void>;

  /** Entre los vigentes, sin distinguir mayúsculas. */
  existeNombre(nombre: string, excluirId?: number): Promise<boolean>;

  /**
   * Impide que el servicio se modifique o elimine mientras se asigna. Varias
   * asignaciones conviven. No falla si no existe.
   */
  bloquearParaAsignar(id: number): Promise<void>;

  /** Espera a quien lo esté asignando o modificando. No falla si no existe. */
  bloquearParaModificar(id: number): Promise<void>;

  clienteTieneServicio(servicioId: number, clienteId: number): Promise<boolean>;

  contarUso(id: number): Promise<UsoServicioAdicional>;

  /**
   * Guarda el borrado lógico solo si el servicio sigue vigente y sin uso.
   * Nunca borra la fila.
   * @throws ServicioAdicionalModificadoError si dejó de cumplirlo.
   */
  eliminar(entity: ServicioAdicionalEntity): Promise<void>;
}
