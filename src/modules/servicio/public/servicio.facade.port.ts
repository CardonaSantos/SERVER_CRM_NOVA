export const SERVICIO = Symbol('SERVICIO');

export type VerificarPlanAsignableInput = {
  planId: number;
  /** Con él, se admite un plan inactivo que el cliente ya tiene. */
  clienteId?: number;
};

export type VerificarServiciosAsignablesInput = {
  servicioIds: number[];
  /** Con él, se admiten los inactivos que el cliente ya tiene. */
  clienteId?: number;
};

/**
 * Llama a todos sus métodos dentro de la unidad de trabajo que escribe la
 * referencia: lo verificado no podrá eliminarse hasta que esta termine.
 */
export interface ServicioFacadePort {
  /**
   * Confirma que el plan puede asignarse.
   * @throws PlanInternetNoEncontradoError si no existe.
   * @throws PlanInternetEliminadoError si está eliminado.
   * @throws PlanInternetInactivoError si está inactivo y el cliente no lo tiene.
   */
  verificarPlanAsignable(input: VerificarPlanAsignableInput): Promise<void>;

  /**
   * Confirma que el plan existe, aunque esté inactivo. Para anotar el plan en un
   * registro histórico.
   * @throws PlanInternetNoEncontradoError si no existe.
   * @throws PlanInternetEliminadoError si está eliminado.
   */
  verificarPlanVigente(planId: number): Promise<void>;

  /**
   * Confirma que los servicios adicionales pueden asignarse.
   * @throws ServicioAdicionalNoEncontradoError si alguno no existe.
   * @throws ServicioAdicionalEliminadoError si alguno está eliminado.
   * @throws ServicioAdicionalInactivoError si alguno está inactivo y el
   * cliente no lo tiene.
   */
  verificarServiciosAsignables(
    input: VerificarServiciosAsignablesInput,
  ): Promise<void>;
}
