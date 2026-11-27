import { PlanInternetEntity } from '../entities/plan-internet.entity';
import { UsoPlanInternetDescrito } from '../errors/servicio.errors';

export const PLAN_INTERNET_REPOSITORY = Symbol('PLAN_INTERNET_REPOSITORY');

/** `clientes` incluye los eliminados: el plan es parte de su bitácora. */
export type UsoPlanInternet = UsoPlanInternetDescrito;

export type ClientesDelPlan = {
  /** Clientes no eliminados con el plan. */
  total: number;
  /** De ellos, los activos y sin desinstalar: se les factura. */
  facturables: number;
};

/**
 * Los bloqueos solo tienen efecto dentro de una unidad de trabajo y duran hasta
 * que termina.
 */
export interface PlanInternetRepositoryPort {
  /** Devuelve también los eliminados. */
  findById(id: number): Promise<PlanInternetEntity | null>;

  create(entity: PlanInternetEntity): Promise<PlanInternetEntity>;

  /**
   * Guarda nombre, velocidad y estado de un plan vigente. No toca el precio.
   * @throws PlanInternetModificadoError si ya no está vigente.
   */
  update(entity: PlanInternetEntity): Promise<PlanInternetEntity>;

  /**
   * Guarda solo el precio de un plan vigente.
   * @throws PlanInternetModificadoError si ya no está vigente.
   */
  guardarPrecio(entity: PlanInternetEntity): Promise<void>;

  /** Impide que dos operaciones revisen y escriban nombres a la vez. */
  bloquearNombres(): Promise<void>;

  /** Entre los vigentes, sin distinguir mayúsculas. */
  existeNombre(nombre: string, excluirId?: number): Promise<boolean>;

  /**
   * Impide que el plan se modifique o elimine mientras se asigna. Varias
   * asignaciones conviven. No falla si no existe.
   */
  bloquearParaAsignar(id: number): Promise<void>;

  /** Espera a quien lo esté asignando o modificando. No falla si no existe. */
  bloquearParaModificar(id: number): Promise<void>;

  /** Lo tiene como plan o en un acceso de internet que no está de baja. */
  clienteTienePlan(planId: number, clienteId: number): Promise<boolean>;

  contarClientes(id: number): Promise<ClientesDelPlan>;

  contarUso(id: number): Promise<UsoPlanInternet>;

  /**
   * Guarda el borrado lógico solo si el plan sigue vigente y sin ningún uso.
   * Nunca borra la fila.
   * @throws PlanInternetModificadoError si dejó de cumplirlo.
   */
  eliminar(entity: PlanInternetEntity): Promise<void>;
}
